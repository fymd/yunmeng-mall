#!/usr/bin/env bash
# one-shot-deploy-user.sh
# 一次性临时部署账号：动态用户名 + 动态 SSH 密钥；支持创建与回收。
#
# 用法（需 root 或 sudo）：
#   sudo bash one-shot-deploy-user.sh create [项目目录]
#   sudo bash one-shot-deploy-user.sh revoke
#   sudo bash one-shot-deploy-user.sh status
#
# 环境变量（可选）：
#   PROJECT_DIR   默认 /opt/yunmeng-mall
#   STATE_DIR     默认 /var/lib/yunmeng-one-shot
#   KEY_OUT_DIR   私钥输出目录，默认当前目录（运行脚本的 cwd）

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/yunmeng-mall}"
STATE_DIR="${STATE_DIR:-/var/lib/yunmeng-one-shot}"
STATE_FILE="${STATE_DIR}/active.env"
KEY_OUT_DIR="${KEY_OUT_DIR:-$(pwd)}"

need_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "请使用 root 或 sudo 运行此脚本" >&2
    exit 1
  fi
}

rand_suffix() {
  # 8 位十六进制，足够一次性标识
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
  if id "${DEPLOY_USER:-}" &>/dev/null; then
    echo "  系统用户: 存在"
    groups "$DEPLOY_USER" 2>/dev/null || true
  else
    echo "  系统用户: 已不存在（可执行 revoke 清理状态文件）"
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

  if ! command -v docker >/dev/null 2>&1; then
    echo "警告: 未检测到 docker 命令。仍会创建用户，但无法加入 docker 组生效前请先安装 Docker。" >&2
  fi

  if ! getent group docker >/dev/null 2>&1; then
    echo "警告: 系统无 docker 组。请先安装 Docker 后再把用户加入该组。" >&2
  fi

  echo "==> 创建一次性用户: ${user}"
  useradd -m -s /bin/bash "$user"

  mkdir -p "${home_dir}/.ssh"
  chmod 700 "${home_dir}/.ssh"

  # 动态生成 ed25519 密钥（无口令，仅本次部署）
  if command -v ssh-keygen >/dev/null 2>&1; then
    ssh-keygen -t ed25519 -f "$priv_path" -N "" -C "one-shot-${user}@$(hostname -s 2>/dev/null || echo host)" >/dev/null
  else
    echo "错误: 需要 ssh-keygen" >&2
    userdel -r "$user" 2>/dev/null || userdel "$user"
    exit 1
  fi

  cp "${pub_path}" "${home_dir}/.ssh/authorized_keys"
  chmod 600 "${home_dir}/.ssh/authorized_keys"
  chown -R "${user}:${user}" "${home_dir}/.ssh"

  # 禁止密码登录该用户
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

  # 私钥仅当前操作者可读
  chmod 600 "$priv_path"
  chmod 644 "$pub_path"

  echo ""
  echo "==================== 创建成功（一次性） ===================="
  echo "用户名:     ${user}"
  echo "项目目录:   ${PROJECT_DIR}"
  echo "私钥文件:   ${priv_path}"
  echo "公钥文件:   ${pub_path}"
  echo "指纹:       ${fp}"
  echo ""
  echo "本机连接示例:"
  echo "  ssh -i ${priv_path} ${user}@<服务器IP>"