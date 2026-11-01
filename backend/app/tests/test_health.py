from httpx import AsyncClient


async def test_health_returns_ok(async_client: AsyncClient) -> None:
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_returns_x_request_id(async_client: AsyncClient) -> None:
    response = await async_client.get("/health")
    assert "x-request-id" in response.headers
    # Проверяем, что сгенерированный ID — это UUID (или хотя бы не пустая строка)
    assert len(response.headers["x-request-id"]) > 0


async def test_health_respects_custom_request_id(async_client: AsyncClient) -> None:
    custom_id = "test-request-id-123"
    response = await async_client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.headers["x-request-id"] == custom_id
