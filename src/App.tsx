import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Edificios from "./pages/Edificios";  // ✅ Agregar'
import Divisiones from "./pages/Divisiones"; 
import ProtectedRoute from "./ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/eventos" 
          element={
            <ProtectedRoute>
              <Eventos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute>
              <Usuarios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reportes" 
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edificios" 
          element={
            <ProtectedRoute>
              <Edificios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/divisiones" 
          element={
            <ProtectedRoute>
              <Divisiones />
            </ProtectedRoute>
          } 
        />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;