#!/bin/bash
# SQLens 资源下载脚本
# 下载 sqlmap 到 resources/ 目录，供打包使用

set -e

SQLMAP_DIR="$(cd "$(dirname "$0")/../resources" && pwd)/sqlmap"

echo "📦 正在下载 sqlmap..."
if [ -d "$SQLMAP_DIR" ]; then
  echo "  → sqlmap 已存在，拉取最新更新..."
  cd "$SQLMAP_DIR"
  git pull
else
  echo "  → 克隆 sqlmap 到 $SQLMAP_DIR"
  git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git "$SQLMAP_DIR"
fi

echo ""
echo "✅ sqlmap 就绪！"
echo "   路径: $SQLMAP_DIR"
echo "   版本: $(cd "$SQLMAP_DIR" && python sqlmap.py --version 2>/dev/null | head -1 || echo 'unknown')"
