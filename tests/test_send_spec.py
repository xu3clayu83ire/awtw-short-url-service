import pytest
import sys
from unittest.mock import patch, MagicMock, mock_open


def 應該_成功推送規格並輸出成功訊息_當Webhook回傳200時(tmp_path, capsys):
    spec_file = tmp_path / "spec.md"
    spec_file.write_text("# 測試規格內容", encoding="utf-8")

    mock_webhook = MagicMock()
    mock_webhook.status_code = 200

    with patch("send_spec.check_slug_exists", return_value=False), \
         patch("send_spec.requests.post", return_value=mock_webhook), \
         patch("send_spec.NOTION_TOKEN", "fake-token"), \
         patch("send_spec.NOTION_DATABASE_ID", "fake-db-id"), \
         patch("send_spec.N8N_WEBHOOK_URL", "http://localhost:5678/webhook/test"):
        from send_spec import push_spec
        result = push_spec("測試功能", "test-slug", 10, str(spec_file))

    captured = capsys.readouterr()
    assert result == 0
    assert "成功" in captured.out


def 應該_跳過推送並輸出已存在_當Slug已在Notion中時(tmp_path, capsys):
    spec_file = tmp_path / "spec.md"
    spec_file.write_text("# 測試規格內容", encoding="utf-8")

    with patch("send_spec.check_slug_exists", return_value=True), \
         patch("send_spec.NOTION_TOKEN", "fake-token"), \
         patch("send_spec.NOTION_DATABASE_ID", "fake-db-id"), \
         patch("send_spec.N8N_WEBHOOK_URL", "http://localhost:5678/webhook/test"):
        from send_spec import push_spec
        result = push_spec("測試功能", "test-slug", 10, str(spec_file))

    captured = capsys.readouterr()
    assert result == 0
    assert "已存在" in captured.out


def 應該_輸出錯誤並回傳1_當Webhook回傳非200時(tmp_path, capsys):
    spec_file = tmp_path / "spec.md"
    spec_file.write_text("# 測試規格內容", encoding="utf-8")

    mock_webhook = MagicMock()
    mock_webhook.status_code = 500
    mock_webhook.text = "Internal Server Error"

    with patch("send_spec.check_slug_exists", return_value=False), \
         patch("send_spec.requests.post", return_value=mock_webhook), \
         patch("send_spec.NOTION_TOKEN", "fake-token"), \
         patch("send_spec.NOTION_DATABASE_ID", "fake-db-id"), \
         patch("send_spec.N8N_WEBHOOK_URL", "http://localhost:5678/webhook/test"):
        from send_spec import push_spec
        result = push_spec("測試功能", "test-slug", 10, str(spec_file))

    captured = capsys.readouterr()
    assert result == 1
    assert "錯誤" in captured.out


test_成功推送 = 應該_成功推送規格並輸出成功訊息_當Webhook回傳200時
test_跳過推送 = 應該_跳過推送並輸出已存在_當Slug已在Notion中時
test_失敗回傳1 = 應該_輸出錯誤並回傳1_當Webhook回傳非200時
