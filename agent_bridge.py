"""
agent_bridge.py
~~~~~~~~~~~~~~~
Bridge script để backend Node.js gọi agent.py qua process Python.
Input: session_id + message
Output stdout: JSON { ok, answer | error }
"""

from __future__ import annotations

import argparse
import json
import traceback

from agent import AcademicAdvisorAgent


def main() -> int:
    parser = argparse.ArgumentParser(description="Bridge gọi AcademicAdvisorAgent từ Node backend")
    parser.add_argument("--session-id", required=True, help="Session id cho hội thoại")
    parser.add_argument("--message", required=True, help="Tin nhắn gửi cho agent")
    args = parser.parse_args()

    try:
        advisor = AcademicAdvisorAgent()
        answer = advisor.chat(args.session_id, args.message)
        print(json.dumps({"ok": True, "answer": answer}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": str(exc),
                    "trace": traceback.format_exc(),
                },
                ensure_ascii=False,
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
