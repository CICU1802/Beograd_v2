"""
crawl_data.py
~~~~~~~~~~~~~
Crawler thu thập dữ liệu từ:
1) Demo backend (2 trang demo student/results thông qua API login payload)
2) Class status web (danh sách lớp học phần)

Có thể dùng theo 2 cách:
  - Import hàm trong code: crawl_all_sources(...)
  - Chạy CLI: python -X utf8 crawl_data.py --all-terms
"""

from __future__ import annotations

import argparse
import itertools
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


def _request_json(url: str, method: str = "GET", payload: dict[str, Any] | None = None, timeout: int = 20) -> Any:
	"""Gửi HTTP request và parse JSON response."""
	data = None
	headers = {"Accept": "application/json"}
	if payload is not None:
		data = json.dumps(payload).encode("utf-8")
		headers["Content-Type"] = "application/json"

	req = Request(url=url, data=data, method=method, headers=headers)
	try:
		with urlopen(req, timeout=timeout) as response:
			return json.loads(response.read().decode("utf-8"))
	except HTTPError as exc:
		body = exc.read().decode("utf-8", errors="replace")
		raise RuntimeError(f"HTTP {exc.code} khi gọi {url}: {body}") from exc
	except URLError as exc:
		raise RuntimeError(f"Không kết nối được {url}: {exc.reason}") from exc


def _request_text(url: str, timeout: int = 20) -> str:
	"""Gọi HTTP GET và trả về text body (dùng để kiểm tra trang frontend có truy cập được không)."""
	req = Request(url=url, method="GET", headers={"Accept": "text/html,*/*"})
	try:
		with urlopen(req, timeout=timeout) as response:
			return response.read().decode("utf-8", errors="replace")
	except HTTPError as exc:
		body = exc.read().decode("utf-8", errors="replace")
		raise RuntimeError(f"HTTP {exc.code} khi gọi {url}: {body}") from exc
	except URLError as exc:
		raise RuntimeError(f"Không kết nối được {url}: {exc.reason}") from exc


def _normalize_base(base_url: str) -> str:
	return base_url.rstrip("/") + "/"


def _flatten_class_status_rows(class_status_json: dict[str, Any]) -> list[dict[str, Any]]:
	rows: list[dict[str, Any]] = []
	for sem in class_status_json.get("semesters", []):
		hk = sem.get("hoc_ky")
		hk_label = sem.get("hoc_ky_nhan")
		for row in sem.get("danh_sach_lop_hoc_phan", []):
			rows.append({**row, "hoc_ky": hk, "hoc_ky_nhan": hk_label})
	return rows


def crawl_demo_backend(
	demo_api_base: str = "http://localhost:4000",
	frontend_results_url: str = "http://localhost:3000/results",
	username: str = "Beograd",
	password: str = "Beograd",
	include_all_terms: bool = True,
) -> dict[str, Any]:
	"""
	Crawl dữ liệu từ backend demo.

	Trả về:
	  - options login
	  - danh sách kịch bản đã crawl
	  - tổng hợp term + course cho agent xử lý downstream
	"""
	base = _normalize_base(demo_api_base)
	options_url = urljoin(base, "api/options")
	login_url = urljoin(base, "api/auth/login")

	# Xác thực quyền/truy cập tới trang kết quả học tập frontend.
	# Dữ liệu điểm thực tế được trang này lấy từ backend API (/api/auth/login).
	results_page_info = {
		"url": frontend_results_url,
		"reachable": False,
		"html_size": 0,
	}
	try:
		html = _request_text(frontend_results_url)
		results_page_info["reachable"] = True
		results_page_info["html_size"] = len(html)
	except Exception as exc:
		results_page_info["error"] = str(exc)

	options = _request_json(options_url)
	performances = options.get("performance", [])
	score_profiles = options.get("scoreProfiles", [])
	terms = options.get("terms", [])

	selected_terms = terms if include_all_terms else (terms[-1:] if terms else [])

	scenarios: list[dict[str, Any]] = []
	all_term_rows: list[dict[str, Any]] = []
	all_course_rows: list[dict[str, Any]] = []

	for perf, profile, term in itertools.product(performances, score_profiles, selected_terms):
		payload = {
			"username": username,
			"password": password,
			"performance": perf.get("value"),
			"scoreProfile": profile.get("value"),
			"year": term.get("year"),
			"semester": term.get("semester"),
		}
		login_res = _request_json(login_url, method="POST", payload=payload)
		data = login_res.get("payload", {})

		scenario_id = (
			f"{payload['performance']}|{payload['scoreProfile']}|"
			f"{payload['year']}-{payload['semester']}"
		)

		scenario_item = {
			"scenario_id": scenario_id,
			"config": data.get("config", {}),
			"student": data.get("student", {}),
			"overview": data.get("overview", {}),
			"term_count": len(data.get("terms", [])),
		}
		scenarios.append(scenario_item)

		for term_item in data.get("terms", []):
			term_row = {
				"scenario_id": scenario_id,
				"year": term_item.get("year"),
				"semester": term_item.get("semester"),
				"code": term_item.get("code"),
				"semesterGpa4": term_item.get("semesterGpa4"),
				"semesterCredits": term_item.get("semesterCredits"),
				"course_count": len(term_item.get("rows", [])),
			}
			all_term_rows.append(term_row)

			for course in term_item.get("rows", []):
				all_course_rows.append(
					{
						"scenario_id": scenario_id,
						"year": term_item.get("year"),
						"semester": term_item.get("semester"),
						"term_code": term_item.get("code"),
						"courseCode": course.get("courseCode"),
						"courseName": course.get("courseName"),
						"credits": course.get("credits"),
						"score10": course.get("score10"),
						"score4": course.get("score4"),
						"letter": course.get("letter"),
						"passed": course.get("passed"),
					}
				)

	return {
		"source": "demo_backend",
		"base_url": demo_api_base,
		"frontend_results_page": results_page_info,
		"options": options,
		"summary": {
			"scenario_count": len(scenarios),
			"term_rows": len(all_term_rows),
			"course_rows": len(all_course_rows),
		},
		"scenarios": scenarios,
		"terms": all_term_rows,
		"courses": all_course_rows,
	}


def crawl_class_status_web(class_status_base: str = "http://localhost:3200") -> dict[str, Any]:
	"""Crawl dữ liệu từ trang class-status-web qua JSON feed công khai."""
	base = _normalize_base(class_status_base)

	# Xác thực có thể truy cập trực tiếp trang class-status-web root.
	class_status_page_info = {
		"url": base,
		"reachable": False,
		"html_size": 0,
	}
	try:
		html = _request_text(base)
		class_status_page_info["reachable"] = True
		class_status_page_info["html_size"] = len(html)
	except Exception as exc:
		class_status_page_info["error"] = str(exc)

	data_url = urljoin(base, "course_timetable_generated.json")
	class_status_json = _request_json(data_url)
	rows = _flatten_class_status_rows(class_status_json)

	open_count = sum(1 for r in rows if "đăng kí" in str(r.get("tinh_trang_lhp", "")))
	cancelled_count = sum(1 for r in rows if str(r.get("tinh_trang_lhp", "")).strip() == "Hủy")

	return {
		"source": "class_status_web",
		"base_url": class_status_base,
		"page": class_status_page_info,
		"summary": {
			"total_semesters": class_status_json.get("total_semesters"),
			"total_classes": class_status_json.get("total_classes"),
			"rows_flattened": len(rows),
			"open_classes": open_count,
			"cancelled_classes": cancelled_count,
		},
		"raw": class_status_json,
		"rows": rows,
	}


def crawl_all_sources(
	demo_api_base: str = "http://localhost:4000",
	frontend_results_url: str = "http://localhost:3000/results",
	class_status_base: str = "http://localhost:3200",
	username: str = "Beograd",
	password: str = "Beograd",
	include_all_terms: bool = True,
) -> dict[str, Any]:
	"""Crawl đồng thời 2 nguồn dữ liệu để dùng cho AI agent."""
	now = datetime.now(timezone.utc).isoformat()

	demo_data = crawl_demo_backend(
		demo_api_base=demo_api_base,
		frontend_results_url=frontend_results_url,
		username=username,
		password=password,
		include_all_terms=include_all_terms,
	)
	class_status_data = crawl_class_status_web(class_status_base=class_status_base)

	return {
		"generated_at": now,
		"sources": {
			"demo": demo_data,
			"class_status_web": class_status_data,
		},
	}


def save_crawled_data(data: dict[str, Any], output_path: str = "data/processed/crawled_agent_data.json") -> Path:
	"""Lưu kết quả crawl ra file JSON."""
	out_path = Path(output_path)
	out_path.parent.mkdir(parents=True, exist_ok=True)
	out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
	return out_path


def main() -> None:
	parser = argparse.ArgumentParser(description="Crawler cho demo backend + class-status-web")
	parser.add_argument("--demo-api-base", default="http://localhost:4000", help="Base URL demo backend API")
	parser.add_argument("--frontend-results-url", default="http://localhost:3000/results", help="URL trang kết quả học tập frontend")
	parser.add_argument("--class-status-base", default="http://localhost:3200", help="Base URL class-status-web")
	parser.add_argument("--username", default="Beograd", help="Tài khoản demo")
	parser.add_argument("--password", default="Beograd", help="Mật khẩu demo")
	parser.add_argument("--all-terms", action="store_true", help="Crawl tất cả học kỳ; mặc định chỉ crawl kỳ cuối")
	parser.add_argument("--output", default="data/processed/crawled_agent_data.json", help="Đường dẫn file output JSON")

	args = parser.parse_args()

	data = crawl_all_sources(
		demo_api_base=args.demo_api_base,
		frontend_results_url=args.frontend_results_url,
		class_status_base=args.class_status_base,
		username=args.username,
		password=args.password,
		include_all_terms=args.all_terms,
	)
	out_path = save_crawled_data(data, output_path=args.output)

	demo_summary = data["sources"]["demo"]["summary"]
	class_summary = data["sources"]["class_status_web"]["summary"]
	print(
		"\n".join(
			[
				f"Saved crawl data to: {out_path}",
				f"Demo scenarios: {demo_summary['scenario_count']} | Demo courses: {demo_summary['course_rows']}",
				f"Class-status rows: {class_summary['rows_flattened']} | Open: {class_summary['open_classes']} | Cancelled: {class_summary['cancelled_classes']}",
			]
		)
	)


if __name__ == "__main__":
	main()
