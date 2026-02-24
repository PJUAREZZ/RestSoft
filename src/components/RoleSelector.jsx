// ============================================================
// RoleSelector.jsx — PANTALLA DE SELECCIÓN DE ROL
// ============================================================
// Primera pantalla que ve el usuario al abrir la app.
// Permite elegir entre dos roles:
//   - Administrador: acceso completo al sistema
//   - Usuario: solo puede cargar pedidos
//
// Props:
//   onSelectRole → función de App.jsx que recibe 'admin' o 'user'
// ============================================================

import React from 'react';
import { Shield, Users, Utensils, BarChart3, Clock, Package } from 'lucide-react';
import './RoleSelector.css';

export const RoleSelector = ({ onSelectRole }) => {
  return (
    <div className="role-selector-container">

      {/* ── LADO IZQUIERDO: presentación y features ── */}
      <div className="role-left">
        <div className="role-left-content">

          {/* Marca / nombre de la app */}
          <div className="role-brand">
            <Utensils size={28} />
            <span>RestSoft</span>
          </div>

          {/* Título principal y subtítulo */}
          <div className="role-hero">
            <p className="role-hero-sub">SOFTWARE PARA RESTAURANTES, BARES Y CAFÉS</p>
            <h1 className="role-hero-title">
              Transformá tu negocio gastronómico <span>con RestSoft</span>
            </h1>
          </div>

          {/* Lista de funcionalidades destacadas */}
          <div className="role-features">
            <p className="role-features-title">Descubrí todo lo que podés hacer:</p>

            {/* Cada feature tiene un ícono y una descripción corta */}
            <div className="role-feature-item">
              <div className="role-feature-icon"><Utensils size={18} /></div>
              <span>Gestión de mesas, delivery y mostrador</span>
            </div>
            <div className="role-feature-item">
              <div className="role-feature-icon"><BarChart3 size={18} /></div>
              <span>Estadísticas y reportes en tiempo real</span>
            </div>
            <div className="role-feature-item">
              <div className="role-feature-icon"><Package size={18} /></div>
              <span>Control de productos y categorías</span>
            </div>
            <div className="role-feature-item">
              <div className="role-feature-icon"><Clock size={18} /></div>
              <span>Seguimiento de pedidos con temporizador</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LADO DERECHO: botones para elegir rol ── */}
      <div className="role-right">
        <div className="role-selector-box">
          <h2>Ingresá a tu cuenta</h2>
          <p>Seleccioná tu tipo de acceso para continuar</p>

          <div className="role-buttons">

            {/* Botón Admin: llama a onSelectRole('admin') */}
            <button
              className="role-btn role-btn--admin"
              onClick={() => onSelectRole('admin')}
            >
              <div className="role-btn-icon">
                <Shield size={32} />
              </div>
              <div className="role-btn-text">
                <h3>Administrador</h3>
                <p>Acceso completo al sistema</p>
              </div>
            </button>

            {/* Botón Usuario: llama a onSelectRole('user') */}
            <button
              className="role-btn role-btn--user"
              onClick={() => onSelectRole('user')}
            >
              <div className="role-btn-icon">
                <Users size={32} />
              </div>
              <div className="role-btn-text">
                <h3>Usuario</h3>
                <p>Acceso a carga de pedidos</p>
              </div>
            </button>
          </div>

          <p className="role-footer-text">Tu información está guardada de forma segura y local.</p>
        </div>
      </div>

    </div>
  );
};

export default RoleSelector;
