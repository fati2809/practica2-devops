import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

function Registro() {
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name_user: "",
    email_user: "",
    pass_user: "",
    confirmPassword: "",
    matricula_user: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.pass_user !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const password = formData.pass_user;

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password.length > 72) {
      setError("La contraseña no puede tener más de 72 caracteres");
      return;
    }

    if (!/\d/.test(password)) {
      setError("La contraseña debe incluir al menos un número");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]]/.test(password)) {
      setError("La contraseña debe incluir al menos un caracter especial");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name_user: formData.name_user,
          email_user: formData.email_user,
          pass_user: formData.pass_user,
          matricula_user: parseInt(formData.matricula_user),
          id_rol: 2
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        navigate("/");
      } else {
        setError(data.detail || data.message || "Error al registrarse");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: "420px" }}>
        <h1 className="login-title">Crear Cuenta</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div style={{
              padding: "12px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
              border: "1px solid #fecaca"
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name_user" className="form-label">
              Nombre Completo
            </label>
            <input
              type="text"
              id="name_user"
              name="name_user"
              className="form-input"
              placeholder="Juan Pérez"
              value={formData.name_user}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email_user" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email_user"
              name="email_user"
              className="form-input"
              placeholder="example@email.com"
              value={formData.email_user}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="matricula_user" className="form-label">
              Matrícula
            </label>
            <input
              type="number"
              id="matricula_user"
              name="matricula_user"
              className="form-input"
              placeholder="Ej. 2022374589"
              value={formData.matricula_user}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pass_user" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="pass_user"
              name="pass_user"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={formData.pass_user}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <p className="register-text">
          ¿Ya tienes cuenta?{" "}
          <a href="#" className="register-link" onClick={handleLoginClick}>
            Iniciar Sesión
          </a>
        </p>
      </div>
    </div>
  );
}

export default Registro;