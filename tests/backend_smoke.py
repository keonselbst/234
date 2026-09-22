"""Backend smoke tests for FanOps ERP."""
import json
import io
import sys
import requests

BASE = "https://fan-ops-hub.preview.emergentagent.com/api"
ADMIN = {"username": "keonamore", "password": "31314AMG*!"}

results = {"passed": [], "failed": []}


def rec_pass(name):
    results["passed"].append(name)
    print(f"PASS: {name}")


def rec_fail(name, detail):
    results["failed"].append({"test": name, "detail": str(detail)[:400]})
    print(f"FAIL: {name} :: {detail}")


def main():
    s = requests.Session()

    # 1) Login admin
    try:
        r = s.post(f"{BASE}/auth/login", json=ADMIN, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"no token key: {data}"
        assert data["user"]["role"] == "admin"
        rec_pass("POST /auth/login admin returns JWT + admin user")
    except Exception as e:
        rec_fail("POST /auth/login", e)
        return finalize()

    H = {"Authorization": f"Bearer {token}"}

    # 2) /auth/me
    try:
        r = s.get(f"{BASE}/auth/me", headers=H, timeout=10)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u.get("access_uid"), f"missing access_uid: {u}"
        rec_pass("GET /auth/me returns user w/ access_uid")
    except Exception as e:
        rec_fail("GET /auth/me", e)

    # 3) No auth => 401
    try:
        r = s.get(f"{BASE}/auth/me", timeout=10)
        assert r.status_code in (401, 403), r.status_code
        rec_pass(f"GET /auth/me without token returns {r.status_code}")
    except Exception as e:
        rec_fail("Auth required check", e)

    # 4) Departments seeded
    try:
        r = s.get(f"{BASE}/departments", headers=H, timeout=10)
        assert r.status_code == 200, r.text
        deps = r.json()
        names = [d["name"] for d in deps]
        expected = ["Производство", "Отдел продаж", "Конструкторское бюро", "Закупки"]
        missing = [n for n in expected if n not in names]
        assert not missing, f"missing depts: {missing}. got: {names}"
        assert all("custom_roles" in d for d in deps), "custom_roles not present"
        rec_pass(f"GET /departments seeded 4: {names}")
    except Exception as e:
        rec_fail("GET /departments seed check", e)

    # 5) Department CRUD
    dept_id = None
    try:
        r = s.post(f"{BASE}/departments", headers=H,
                   json={"name": "TestDept", "custom_roles": ["r1", "r2"]}, timeout=10)
        assert r.status_code in (200, 201), r.text
        dept_id = r.json()["id"]
        r = s.put(f"{BASE}/departments/{dept_id}", headers=H,
                  json={"name": "TestDept2", "custom_roles": ["r1", "r2", "r3"]}, timeout=10)
        assert r.status_code == 200, r.text
        r = s.delete(f"{BASE}/departments/{dept_id}", headers=H, timeout=10)
        assert r.status_code in (200, 204), r.text
        rec_pass("Department CRUD (create/update/delete)")
    except Exception as e:
        rec_fail("Department CRUD", e)

    # 6) Employee register + list + update + delete
    emp_id = None
    emp_creds = None
    try:
        # need a department to attach; use first seeded
        deps = s.get(f"{BASE}/departments", headers=H).json()
        did = deps[0]["id"]
        payload = {
            "username": "emp_test_01",
            "password": "Pass1234!",
            "full_name": "Test Employee",
            "role": "employee",
            "department_id": did,
            "position": deps[0]["custom_roles"][0] if deps[0].get("custom_roles") else "worker",
        }
        r = s.post(f"{BASE}/auth/register", headers=H, json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        emp = r.json()
        # try to find access_uid
        assert emp.get("access_uid") or emp.get("user", {}).get("access_uid"), f"no access_uid: {emp}"
        emp_id = emp.get("id") or emp.get("user", {}).get("id")
        emp_creds = {"username": payload["username"], "password": payload["password"]}
        rec_pass("POST /auth/register creates employee with access_uid")
    except Exception as e:
        rec_fail("POST /auth/register", e)

    try:
        r = s.get(f"{BASE}/employees", headers=H, timeout=10)
        assert r.status_code == 200, r.text
        emps = r.json()
        assert isinstance(emps, list) and len(emps) >= 1
        if emp_id is None and emps:
            emp_id = emps[-1]["id"]
        rec_pass(f"GET /employees returns list ({len(emps)})")
    except Exception as e:
        rec_fail("GET /employees", e)

    if emp_id:
        try:
            r = s.put(f"{BASE}/employees/{emp_id}", headers=H,
                      json={"full_name": "Updated Emp"}, timeout=10)
            assert r.status_code == 200, r.text
            rec_pass("PUT /employees/{id}")
        except Exception as e:
            rec_fail("PUT /employees", e)

    # 7) Role check with non-admin BEFORE deleting employee
    non_admin_token = None
    if emp_creds:
        try:
            r = requests.post(f"{BASE}/auth/login", json=emp_creds, timeout=10)
            assert r.status_code == 200, r.text
            non_admin_token = r.json().get("access_token") or r.json().get("token")
            NH = {"Authorization": f"Bearer {non_admin_token}"}
            # non-admin cannot register
            r = requests.post(f"{BASE}/auth/register", headers=NH,
                              json={"username": "x", "password": "x", "full_name": "x",
                                    "role": "employee", "department_id": "x"}, timeout=10)
            assert r.status_code == 403, f"expected 403, got {r.status_code}"
            # non-admin cannot create dept
            r = requests.post(f"{BASE}/departments", headers=NH,
                              json={"name": "nope"}, timeout=10)
            assert r.status_code == 403, f"expected 403, got {r.status_code}"
            rec_pass("Non-admin gets 403 on register/departments")
        except Exception as e:
            rec_fail("Role check 403 non-admin", e)

    if emp_id:
        try:
            r = s.delete(f"{BASE}/employees/{emp_id}", headers=H, timeout=10)
            assert r.status_code in (200, 204), r.text
            rec_pass("DELETE /employees/{id}")
        except Exception as e:
            rec_fail("DELETE /employees", e)

    # 8) CRUD across resources (list, create, update, delete)
    resources = {
        "materials": {"name": "Steel Sheet", "unit": "kg", "quantity": 100, "min_quantity": 10, "price": 50},
        "leads": {"name": "Acme Corp", "contact": "John", "phone": "+123", "status": "new"},
        "customers": {"name": "Best Buy", "contact_person": "Jane", "phone": "+321"},
        "suppliers": {"name": "SupplyCo", "contact_person": "Ivan", "phone": "+555"},
        "orders": {"customer_name": "Best Buy", "product": "Fan-100", "quantity": 5, "status": "pending"},
        "budget": {"type": "income", "amount": 5000, "description": "Test income", "category": "sales"},
    }
    for res, payload in resources.items():
        try:
            r = s.get(f"{BASE}/{res}", headers=H, timeout=10)
            assert r.status_code == 200, r.text
            r = s.post(f"{BASE}/{res}", headers=H, json=payload, timeout=10)
            assert r.status_code in (200, 201), f"CREATE {res}: {r.status_code} {r.text}"
            obj = r.json()
            oid = obj["id"]
            r = s.put(f"{BASE}/{res}/{oid}", headers=H, json=payload, timeout=10)
            assert r.status_code == 200, f"UPDATE {res}: {r.status_code} {r.text}"
            r = s.delete(f"{BASE}/{res}/{oid}", headers=H, timeout=10)
            assert r.status_code in (200, 204), f"DELETE {res}: {r.status_code} {r.text}"
            rec_pass(f"CRUD /{res}")
        except Exception as e:
            rec_fail(f"CRUD /{res}", e)

    # 9) Upload
    data_url = None
    try:
        files = {"file": ("t.txt", io.BytesIO(b"hello world"), "text/plain")}
        r = s.post(f"{BASE}/upload", headers=H, files=files, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "data_url" in j and j["data_url"].startswith("data:"), j
        data_url = j["data_url"]
        rec_pass("POST /upload returns data_url")
    except Exception as e:
        rec_fail("POST /upload", e)

    # 10) Model create with preview_url
    try:
        payload = {"name": "M-100", "description": "Test", "preview_url": data_url or "data:text/plain;base64,aGVsbG8="}
        r = s.post(f"{BASE}/models", headers=H, json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        r = s.get(f"{BASE}/models", headers=H, timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list), r.text
        rec_pass("Models create + list")
    except Exception as e:
        rec_fail("Models", e)

    # 11) Dashboard summary
    try:
        r = s.get(f"{BASE}/dashboard/summary", headers=H, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "kpis" in j, j
        for k in ["stock_value", "balance", "income", "expense", "active_orders",
                  "hot_leads", "customers", "employees", "departments"]:
            assert k in j["kpis"], f"missing kpi: {k}"
        for k in ["recent_orders", "recent_leads", "low_stock"]:
            assert k in j and isinstance(j[k], list), f"missing/invalid: {k}"
        rec_pass("GET /dashboard/summary KPIs + arrays present")
    except Exception as e:
        rec_fail("GET /dashboard/summary", e)

    # 12) AI assistant
    try:
        r = s.post(f"{BASE}/assistant/chat", headers=H,
                   json={"message": "Привет, кто ты?"}, timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        j = r.json()
        assert "text" in j and "provider" in j, j
        rec_pass(f"POST /assistant/chat provider={j.get('provider')}, len(text)={len(j.get('text',''))}")
    except Exception as e:
        rec_fail("POST /assistant/chat", e)

    try:
        r = s.get(f"{BASE}/assistant/history", headers=H, timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list), r.text
        rec_pass("GET /assistant/history")
    except Exception as e:
        rec_fail("GET /assistant/history", e)

    # 13) Profile update
    try:
        r = s.put(f"{BASE}/auth/profile", headers=H,
                  json={"full_name": "Keo Admin", "phone": "+79990001122",
                        "position": "CEO", "language": "ru"}, timeout=10)
        assert r.status_code == 200, r.text
        rec_pass("PUT /auth/profile")
    except Exception as e:
        rec_fail("PUT /auth/profile", e)

    # 14) Change password: wrong old => 400, then success (revert)
    try:
        r = s.post(f"{BASE}/auth/change-password", headers=H,
                   json={"old_password": "WRONG", "new_password": "NewPass123!"}, timeout=10)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"
        rec_pass("Change-password wrong old => 400")
    except Exception as e:
        rec_fail("Change-password wrong old", e)

    try:
        # change to new
        r = s.post(f"{BASE}/auth/change-password", headers=H,
                   json={"old_password": ADMIN["password"], "new_password": "TempPass123!"}, timeout=10)
        assert r.status_code == 200, r.text
        # revert
        r = s.post(f"{BASE}/auth/change-password", headers=H,
                   json={"old_password": "TempPass123!", "new_password": ADMIN["password"]}, timeout=10)
        assert r.status_code == 200, r.text
        rec_pass("Change-password correct old => 200 (and reverted)")
    except Exception as e:
        rec_fail("Change-password success", e)

    finalize()


def finalize():
    print("\n=== SUMMARY ===")
    print(f"PASSED: {len(results['passed'])}")
    print(f"FAILED: {len(results['failed'])}")
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
