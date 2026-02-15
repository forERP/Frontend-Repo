import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { login } from "../api/authApi";
import "./Login.css";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.authRequired) {
      window.alert("로그인이 필요한 서비스입니다.");
      navigate("/login", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.identifier || !credentials.password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await login(credentials);
      
      // 로그인 성공 시 사용자 정보 저장
      if (setUser) {
        setUser({
          userId: response.userId,
          role: response.role,
        });
      }

      // 대시보드로 이동
      navigate("/");
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.form
        className="login-box"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>로그인</h1>

        <input
          name="identifier"
          placeholder="아이디"
          value={credentials.identifier}
          onChange={onChange}
          autoComplete="username"
          disabled={loading}
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={credentials.password}
          onChange={onChange}
          autoComplete="current-password"
          disabled={loading}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </motion.form>
    </div>
  );
}
