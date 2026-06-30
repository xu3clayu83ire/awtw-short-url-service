"""
send_spec.py — 將本地規格文件推送至 n8n Webhook，同步建立 Notion 資料

用法：
    py send_spec.py "<功能名稱>" "<slug>" <weight> "<spec_md_路徑>"

範例：
    py send_spec.py "個人縮網址服務" "short-url-service" 10 "_spec/phase1-infrastructure/spec.md"
"""

import sys
import os
import requests
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")


def check_slug_exists(notion_token: str, database_id: str, slug: str) -> bool:
    """在 Notion 主表中查詢指定 Slug 是否已存在，避免重複建立資料。"""
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }
    payload = {
        "filter": {
            "property": "Slug",
            "rich_text": {"equals": slug},
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(
            f"Notion API 查詢失敗，狀態碼：{response.status_code}，內容：{response.text}"
        )

    results = response.json().get("results", [])
    return len(results) > 0


def push_spec(name: str, slug: str, weight: int, spec_path: str) -> int:
    """讀取規格文件並推送至 n8n Webhook，含冪等檢查。回傳 exit code。"""
    if not all([NOTION_TOKEN, NOTION_DATABASE_ID, N8N_WEBHOOK_URL]):
        print("錯誤：請確認 .env 已設定 NOTION_TOKEN、NOTION_DATABASE_ID、N8N_WEBHOOK_URL")
        return 1

    if check_slug_exists(NOTION_TOKEN, NOTION_DATABASE_ID, slug):
        print(f"已存在，跳過：Slug「{slug}」已在 Notion 主表中，不重複建立。")
        return 0

    try:
        with open(spec_path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"錯誤：找不到規格文件 {spec_path}")
        return 1

    payload = {
        "name": f"【規格】{name}",
        "slug": slug,
        "weight": weight,
        "content": content,
    }

    response = requests.post(N8N_WEBHOOK_URL, json=payload)

    if response.status_code == 200:
        print(f"成功：「{name}」規格已推送至 Notion（Slug: {slug}）")
        return 0
    else:
        print(f"錯誤：Webhook 回傳 {response.status_code}，內容：{response.text}")
        return 1


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("用法：py send_spec.py \"<功能名稱>\" \"<slug>\" <weight> \"<spec_md_路徑>\"")
        sys.exit(1)

    _, name, slug, weight_str, spec_path = sys.argv

    try:
        weight = int(weight_str)
    except ValueError:
        print(f"錯誤：weight 必須是整數，收到「{weight_str}」")
        sys.exit(1)

    sys.exit(push_spec(name, slug, weight, spec_path))
