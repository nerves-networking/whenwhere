#!/usr/bin/env elixir

Mix.install([
  {:req, "~> 0.5.0"}
])

ExUnit.start()

defmodule ValidationTests do
  use ExUnit.Case, async: true

  @server "http://whenwhere.nerves-project.org/"

  test "head request w/o nonce" do
    result = Req.head!(@server)

    assert result.status == 200
    assert result.headers["cache-control"] == ["no-cache, must-revalidate, max-age=0"]
    assert result.headers["x-nonce"] == nil

    [now] = result.headers["x-now"]
    assert {:ok, _, _} = DateTime.from_iso8601(now)
  end

  test "head request w/ nonce" do
    result = Req.head!("#{@server}?nonce=0123456789abcdef")

    assert result.status == 200
    assert result.headers["cache-control"] == ["no-cache, must-revalidate, max-age=0"]
    assert result.headers["x-nonce"] == ["0123456789abcdef"]
  end

  test "invalid nonce" do
    result = Req.head!("#{@server}?nonce=0123456789012345678901234567890123")

    assert result.status == 400
  end

  test "get request w/o nonce" do
    result = Req.get!(@server)

    assert result.status == 200
    assert result.headers["cache-control"] == ["no-cache, must-revalidate, max-age=0"]
    assert result.headers["content-type"] == ["application/json"]
    assert result.headers["x-nonce"] == nil

    [now] = result.headers["x-now"]
    assert {:ok, _, _} = DateTime.from_iso8601(now)

    assert result.body["now"] == now
    assert Map.has_key?(result.body, "time_zone")
    assert Map.has_key?(result.body, "latitude")
    assert Map.has_key?(result.body, "longitude")
    assert Map.has_key?(result.body, "city")
    assert Map.has_key?(result.body, "country")
    assert Map.has_key?(result.body, "address")
  end

  test "time passes" do
    result1 = Req.head!(@server)
    result2 = Req.head!(@server)

    [first_time_str] = result1.headers["x-now"]
    [second_time_str] = result2.headers["x-now"]

    first_time = NaiveDateTime.from_iso8601!(first_time_str)
    second_time = NaiveDateTime.from_iso8601!(second_time_str)

    delta = NaiveDateTime.diff(second_time, first_time, :millisecond)

    assert delta > 0
    assert delta < 1000
  end
end
