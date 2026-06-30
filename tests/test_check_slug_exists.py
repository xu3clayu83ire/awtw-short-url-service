import pytest
from unittest.mock import patch, MagicMock
from send_spec import check_slug_exists


def 應該_回傳True_當Notion中已存在相同Slug時():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [{"id": "abc123", "properties": {"Slug": {"rich_text": [{"plain_text": "test-slug"}]}}}]
    }

    with patch("send_spec.requests.post", return_value=mock_response):
        result = check_slug_exists("fake-token", "fake-db-id", "test-slug")

    assert result is True


def 應該_回傳False_當Notion中不存在該Slug時():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": []}

    with patch("send_spec.requests.post", return_value=mock_response):
        result = check_slug_exists("fake-token", "fake-db-id", "not-exist-slug")

    assert result is False


def 應該_拋出例外_當Notion_API回傳非200時():
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"

    with patch("send_spec.requests.post", return_value=mock_response):
        with pytest.raises(RuntimeError, match="Notion API 查詢失敗"):
            check_slug_exists("bad-token", "fake-db-id", "test-slug")


# pytest 需要 test_ 前綴才會自動收集，用 wrapper 保留繁體中文命名
test_回傳True = 應該_回傳True_當Notion中已存在相同Slug時
test_回傳False = 應該_回傳False_當Notion中不存在該Slug時
test_拋出例外 = 應該_拋出例外_當Notion_API回傳非200時
