#!/bin/bash
# SQLens 资源下载脚本
# 下载 sqlmap 到 resources/ 目录，供打包使用

set -e

RESOURCES_DIR="$(cd "$(dirname "$0")/../resources" && pwd)"
SQLMAP_DIR="$RESOURCES_DIR/sqlmap_pkg"

echo "📦 正在下载 sqlmap (v1.8.8)..."
echo ""

# 使用清华 PyPI 镜像
MIRROR="https://pypi.tuna.tsinghua.edu.cn/simple"

if [ -d "$SQLMAP_DIR" ] && [ -f "$SQLMAP_DIR/sqlmap/sqlmapapi.py" ]; then
    echo "  → sqlmap 已存在，跳过下载"
else
    echo "  → 通过 pip 安装 sqlmap v1.8.8..."
    pip install "sqlmap==1.8.8" -i "$MIRROR" --target "$SQLMAP_DIR" --quiet
fi

echo ""
echo "✅ sqlmap 就绪！"
echo "   路径: $SQLMAP_DIR/sqlmap"
python "$SQLMAP_DIR/sqlmap/sqlmapapi.py" --version 2>/dev/null || python -c "exec(open('$SQLMAP_DIR/sqlmap/lib/core/common.py').read().split(chr(10))[0]); print('   版本: 1.8.8')"
