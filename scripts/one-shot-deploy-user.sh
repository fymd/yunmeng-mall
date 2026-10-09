#!/usr/bin/env bash
# one-shot-deploy-user.sh
# 一次性临时部署账号：动态用户名 + 动态 SSH 密钥；支持创建与回收。
#
# 用法（需 root 或 sudo）：
#   sudo bash scripts/one-shot-deploy-user.sh create [项目目录]
#   sudo bash scripts/one-shot-deploy-user.sh revoke
#   sudo bash scripts/one-shot-deploy-user.sh status
#
# 环境变量（可选）：
#   PROJECT_DIR   默认 /opt/yunmeng-mall
#   STATE_DIR     默认 /var/lib/yunmeng-one-shot
#   KEY_OUT_DIR   私钥输出目录，默认当前工作目录
#   KEEP_PROJECT  revoke 时设为 1 则保留项目目录属主调整为 root

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/yunmeng-mall}"
STATE_DIR="${STATE_DIR:-/var/lib/yunmeng-one-shot}"
STATE_FILE="${STATE_DIR}/active.env"
KEY_OUT_DIR="${KEY_OUT_DIR:-$(pwd)}"
KEEP_PROJECT="${KEEP_PROJECT:-1}"

need_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "请使用 root 或 sudo 运行此脚本" >&2
    exit 1
  fi
}

rand_suffix() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 4
  else
    head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 8
  fi
}

cmd_status() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "当前无活跃的一次性部署账号。"
    exit 0
  fi
  # shellcheck source=/dev/null
  source "$STATE_FILE"
  echo "活跃一次性账号状态："
  echo "  用户名:   ${DEPLOY_USER:-?}"
  echo "  项目目录: ${PROJECT_DIR:-?}"
  echo "  创建时间: ${CREATED_AT:-?}"
  echo "  公钥指纹: ${KEY_FINGERPRINT:-?}"
  echo "  私钥提示: ${PRIV_KEY_HINT:-?}"
  if id "${DEPLOY_USER:-}" &>/dev/null; then
    echo "  系统用户: 存在 ($(id "$DEPLOY_USER"))"
    echo -n "  组: "; groups "$DEPLOY_USER" 2>/dev/null || true
  else
    echo "  系统用户: 已不存在（可执行 revoke 清理状态）"
  fi
}

cmd_create() {
  need_root

  if [[ -f "$STATE_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$STATE_FILE"
    echo "已存在未回收的一次性账号: ${DEPLOY_USER:-unknown}" >&2
    echo "请先执行: $0 revoke" >&2
    exit 1
  fi

  if [[ "${#}" -ge 1 ]]; then
    PROJECT_DIR="$1"
  fi

  local suffix user home_dir key_base priv_path pub_path fp
  suffix="$(rand_suffix)"
  user="deploy-${suffix}"
  home_dir="/home/${user}"
  key_base="${KEY_OUT_DIR}/yunmeng-${user}"
  priv_path="${key_base}"
  pub_path="${key_base}.pub"

  if [[ -e "$priv_path" || -e "$pub_path" ]]; then
    echo "密钥路径已存在: $priv_path — 请更换 KEY_OUT_DIR 或删除旧文件" >&2
    exit 1
  fi

  if ! command -v ssh-keygen >/dev/null 2>&1; then
    echo "错误: 需要 ssh-keygen" >&2
    exit 1
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "警告: 未检测到 docker。用户仍会创建，安装 Docker 后需重新加入 docker 组。" >&2
  fi
  if ! getent group docker >/dev/null 2>&1; then
    echo "警告: 系统无 docker 组。" >&2
  fi

  echo "==> 创建一次性用户: ${user}"
  useradd -m -s /bin/bash "$user"

  mkdir -p "${home_dir}/.ssh"
  chmod 700 "${home_dir}/.ssh"

  ssh-keygen -t ed25519 -f "$priv_path" -N "" -C "one-shot-${user}@$(hostname -s 2>/dev/null || echo host)" >/dev/null

  cp "${pub_path}" "${home_dir}/.ssh/authorized_keys"
  chmod 600 "${home_dir}/.ssh/authorized_keys"
  chown -R "${user}:${user}" "${home_dir}/.ssh"

  # 锁定密码登录
  passwd -l "$user" >/dev/null 2>&1 || true

  mkdir -p "$PROJECT_DIR"
  chown -R "${user}:${user}" "$PROJECT_DIR"

  if getent group docker >/dev/null 2>&1; then
    usermod -aG docker "$user"
    echo "==> 已加入 docker 组"
  fi

  fp="$(ssh-keygen -lf "$pub_path" 2>/dev/null | awk '{print $2}')"

  mkdir -p "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  cat > "$STATE_FILE" <<EOF
DEPLOY_USER=${user}
PROJECT_DIR=${PROJECT_DIR}
CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
KEY_FINGERPRINT=${fp}
PRIV_KEY_HINT=${priv_path}
EOF
  chmod 600 "$STATE_FILE"

  chmod 600 "$priv_path"
  chmod 644 "$pub_path"

  # 尝试读取本机对外 IP 提示（失败可忽略）
  local hint_ip
  hint_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  hint_ip="${hint_ip:-<服务器IP>}"

  echo ""
  echo "==================== 创建成功（一次性） ===================="
  echo "用户名:     ${user}"
  echo "项目目录:   ${PROJECT_DIR}"
  echo "私钥文件:   ${priv_path}"
  echo "公钥文件:   ${pub_path}"
  echo "指纹:       ${fp}"
  echo ""
  echo "本机连接:"
  echo "  ssh -i ${priv_path} ${user}@${hint_ip}"
  echo ""
  echo "部署结束后务必回收:"
  echo "  sudo bash $0 revoke"
  echo "=========================================================="
  echo ""
  echo "注意: 私钥仅保存在本机路径 ${priv_path}；请勿提交到 Git。"
  echo "      docker 组权限接近 root，密钥泄露风险高，用完即 revoke。"
}

cmd_revoke() {
  need_root

  if [[ ! -f "$STATE_FILE" ]]; then
    echo "无状态文件，尝试按用户名前缀清理…"
    # 仍允许手动指定: REVOKE_USER=deploy-xxxx
    if [[ -n "${REVOKE_USER:-}" ]] && id "$REVOKE_USER" &>/dev/null; then
      DEPLOY_USER="$REVOKE_USER"
    else
      echo "当前没有可回收的一次性账号记录。"
      exit 0
    fi
  else
    # shellcheck source=/dev/null
    source "$STATE_FILE"
  fi

  local user="${DEPLOY_USER:-}"
  local proj="${PROJECT_DIR:-/opt/yunmeng-mall}"
  local hint="${PRIV_KEY_HINT:-}"

  if [[ -z "$user" ]]; then
    echo "状态文件损坏（无 DEPLOY_USER）" >&2
    exit 1
  fi

  echo "==> 回收一次性账号: ${user}"

  if id "$user" &>/dev/null; then
    # 踢掉该用户会话
    if command -v loginctl >/dev/null 2>&1; then
      loginctl terminate-user "$user" 2>/dev/null || true
    fi
    pkill -u "$user" 2>/dev/null || true
    sleep 0.5

    gpasswd -d "$user" docker 2>/dev/null || true
    userdel -r "$user" 2>/dev/null || userdel "$user" 2>/dev/null || true
    echo "==> 已删除用户 ${user}"
  else
    echo "==> 用户 ${user} 已不存在"
  fi

  rm -f /etc/sudoers.d/deploy-docker 2>/dev/null || true
  rm -f /etc/sudoers.d/"${user}" 2>/dev/null || true

  if [[ -d "$proj" ]]; then
    if [[ "$KEEP_PROJECT" == "1" ]]; then
      chown -R root:root "$proj" 2>/dev/null || true
      echo "==> 项目目录保留，属主改为 root: ${proj}"
    else
      echo "==> KEEP_PROJECT=0，不自动删除项目文件（请手动处理 ${proj}）"
    fi
  fi

  if [[ -n "$hint" ]]; then
    echo "==> 请在操作机删除本地密钥（若仍存在）:"
    echo "    rm -f ${hint} ${hint}.pub"
  fi

  rm -f "$STATE_FILE"
  rmdir "$STATE_DIR" 2>/dev/null || true

  echo "==> 回收完成。一次性账号与服务器侧授权已清除。"
}

usage() {
  cat <<EOF
用法:
  sudo bash $0 create [项目目录]   # 动态用户 + 动态密钥
  sudo bash $0 revoke              # 删除用户与授权
  sudo bash $0 status              # 查看当前一次性账号

环境变量:
  PROJECT_DIR=/opt/yunmeng-mall
  KEY_OUT_DIR=.                  # 私钥写入目录
  KEEP_PROJECT=1                 # revoke 时保留代码目录
  REVOKE_USER=deploy-xxxx        # 无状态文件时强制指定回收用户
EOF
}

main() {
  local action="${1:-}"
  shift || true
  case "$action" in
    create) cmd_create "$@" ;;
    revoke) cmd_revoke ;;
    status) cmd_status ;;
    -h|--help|help|"") usage; exit 0 ;;
    *) echo "未知命令: $action" >&2; usage; exit 1 ;;
  esac
}

main "$@"
