import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { login } from "../api/authApi";
import "./Login.css";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const user = await login(form);
      setUser?.(user);

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
          name="username"
          placeholder="아이디"
          value={form.username}
          onChange={onChange}
          autoComplete="username"
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={onChange}
          autoComplete="current-password"
        />

        {error && <p className="error">{error}</p>}

        <button disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </motion.form>
    </div>
  );
}
