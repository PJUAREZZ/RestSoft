// ============================================================
// Auth.jsx — AUTENTICACIÓN (LOGIN, REGISTRO, RECUPERAR CONTRASEÑA)
// ============================================================
// Maneja tres flujos según el rol y el modo activo:
//
//   Rol 'user'  → solo muestra formulario de login simple
//   Rol 'admin' → muestra tabs: login / registro / recuperar contraseña
//
// Todos los datos se guardan en localStorage (sin backend de auth).
// Los usuarios admin se guardan en la key 'users'.
// Los empleados (rol user) se guardan en la key 'employees'.
//
// Props:
//   onAuth → función de App.jsx que recibe el objeto usuario autenticado
//   role   → 'admin' o 'user'
//   onBack → función para volver a RoleSelector
// ============================================================

import React, { useState } from 'react';
import './Auth.css';

// Lista de países con código telefónico para el campo de teléfono en el registro
const COUNTRIES = [
  { code: 'AR', name: 'Argentina',      phone: '+54'  },
  { code: 'BR', name: 'Brasil',         phone: '+55'  },
  { code: 'CL', name: 'Chile',          phone: '+56'  },
  { code: 'CO', name: 'Colombia',       phone: '+57'  },
  { code: 'MX', name: 'México',         phone: '+52'  },
  { code: 'PE', name: 'Perú',           phone: '+51'  },
  { code: 'UY', name: 'Uruguay',        phone: '+598' },
  { code: 'VE', name: 'Venezuela',      phone: '+58'  },
  { code: 'ES', name: 'España',         phone: '+34'  },
  { code: 'US', name: 'Estados Unidos', phone: '+1'   },
  { code: 'CA', name: 'Canadá',         phone: '+1'   },
  { code: 'UK', name: 'Reino Unido',    phone: '+44'  },
];

export const Auth = ({ onAuth, role = 'admin', onBack }) => {

  // ── MODO ACTIVO ───────────────────────────────────────────
  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // ── CAMPOS DEL FORMULARIO ─────────────────────────────────
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone]                 = useState('');
  const [country, setCountry]             = useState('AR'); // código de país por defecto
  const [businessName, setBusinessName]   = useState('');   // nombre del negocio (solo admin)
  const [recoveryCode, setRecoveryCode]   = useState('');   // código generado para recuperación
  const [verifyCode, setVerifyCode]       = useState('');   // código ingresado por el usuario

  // ── MENSAJE DE ERROR ──────────────────────────────────────
  const [error, setError] = useState('');

  // ── HELPERS DE LOCALSTORAGE ───────────────────────────────
  // Carga la lista de admins registrados desde localStorage
  const loadUsers = () => {
    try { return JSON.parse(localStorage.getItem('users')) || []; }
    catch (e) { return []; }
  };

  // Carga la lista de empleados (usuarios con rol 'user')
  const loadEmployees = () => {
    try { return JSON.parse(localStorage.getItem('employees')) || []; }
    catch (e) { return []; }
  };

  // Guarda la lista de admins en localStorage
  const saveUsers = (users) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  // ── GENERAR CÓDIGO DE RECUPERACIÓN ───────────────────────
  // Genera un número de 6 dígitos aleatorio (ej: 483921)
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Busca los datos de un país por su código (ej: 'AR' → { code, name, phone })
  const getCountryData = (countryCode) => {
    return COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  };

  // ── HANDLER: REGISTRO DE ADMIN ────────────────────────────
  // Valida los campos, verifica que el email no esté repetido,
  // guarda el nuevo usuario y llama a onAuth para ingresar.
  const handleRegister = (e) => {
    e.preventDefault(); // evita que el formulario recargue la página
    setError('');

    // Validaciones básicas
    if (!name || !email || !password || !phone || !businessName) {
      setError('Completa todos los campos'); return;
    }
    if (phone.length < 7) {
      setError('Teléfono inválido'); return;
    }

    const users = loadUsers();

    // Verifica que el email no esté ya registrado
    if (users.find(u => u.email === email)) {
      setError('El correo ya está registrado'); return;
    }

    // Combina el código de país con el número ingresado (ej: "+54 1123456789")
    const countryData = getCountryData(country);
    const fullPhone = `${countryData.phone} ${phone}`;

    // Crea el objeto usuario y lo agrega a la lista
    const newUser = { name, email, password, phone: fullPhone, country, businessName };
    users.push(newUser);
    saveUsers(users);

    // Autentica al nuevo usuario inmediatamente
    onAuth({ name, email, phone: fullPhone, country, businessName });
  };

  // ── HANDLER: LOGIN DE ADMIN ───────────────────────────────
  // Busca el usuario por email+contraseña en localStorage.
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Completa correo y contraseña'); return; }

    const users = loadUsers();
    const u = users.find(u => u.email === email && u.password === password);

    if (!u) { setError('Credenciales inválidas'); return; }

    // Pasa los datos del usuario a App.jsx
    onAuth({ name: u.name, email: u.email, phone: u.phone, country: u.country, businessName: u.businessName });
  };

  // ── HANDLER: LOGIN DE USUARIO (EMPLEADO) ─────────────────
  // Busca en la lista de empleados en lugar de admins.
  const handleUserLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Completa correo y contraseña'); return; }

    const employees = loadEmployees();
    const emp = employees.find(e => e.email === email && e.password === password);

    if (!emp) { setError('Credenciales inválidas'); return; }

    onAuth({ name: emp.name, email: emp.email, phone: emp.phone || '', role: 'user' });
  };

  // ── HANDLER: SOLICITAR CÓDIGO DE RECUPERACIÓN ────────────
  // Verifica que el email exista, genera un código de 6 dígitos
  // y lo guarda en localStorage junto con la fecha de generación.
  // En una app real, este código se enviaría por email/SMS.
  const handleForgotRequest = (e) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Ingresa tu correo electrónico'); return; }

    const users = loadUsers();
    const u = users.find(u => u.email === email);

    if (!u) { setError('Correo no registrado'); return; }

    // Genera el código y lo guarda en localStorage
    const code = generateCode();
    const recoveryData = JSON.parse(localStorage.getItem('recovery') || '{}');
    recoveryData[email] = { code, timestamp: Date.now() };
    localStorage.setItem('recovery', JSON.stringify(recoveryData));

    // Guarda el código en el estado para mostrárselo al usuario
    setRecoveryCode(code);
    setError('');
  };

  // ── HANDLER: RESTABLECER CONTRASEÑA ──────────────────────
  // Verifica que el código ingresado coincida con el generado,
  // que las contraseñas coincidan, y actualiza el password en localStorage.
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');

    if (!verifyCode || !password || !passwordConfirm) {
      setError('Completa todos los campos'); return;
    }
    if (verifyCode !== recoveryCode) {
      setError('Código incorrecto'); return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden'); return;
    }

    const users = loadUsers();
    const userIdx = users.findIndex(u => u.email === email);

    if (userIdx === -1) { setError('Usuario no encontrado'); return; }

    // Actualiza el password del usuario y guarda
    users[userIdx].password = password;
    saveUsers(users);

    // Limpia todos los campos y vuelve al login con mensaje de éxito
    setRecoveryCode('');
    setVerifyCode('');
    setPassword('');
    setPasswordConfirm('');
    setEmail('');
    setMode('login');
    setError('Contraseña restablecida. Inicia sesión con tu nueva contraseña');
  };

  // Objeto con nombre y código del país seleccionado actualmente
  const countryData = getCountryData(country);

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Título dinámico según rol y modo */}
        <h2 className="auth-title">
          {role === 'user'
            ? 'Ingresar como Usuario'
            : (mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Registrarse' : 'Recuperar Contraseña')}
        </h2>

        {/* ── FORMULARIO PARA USUARIOS (empleados) ── */}
        {/* Solo muestra email + contraseña, sin registro */}
        {role === 'user' && (
          <form onSubmit={handleUserLogin} className="auth-form">
            <label>Correo Electrónico</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tuemail@ejemplo.com" />

            <label>Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Tu contraseña" />

            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit">Entrar</button>
            <button type="button" className="auth-back-btn" onClick={onBack} style={{ marginTop: '1rem' }}>
              Volver atrás
            </button>
          </form>
        )}

        {/* ── FORMULARIOS PARA ADMIN ── */}
        {role !== 'user' && (
          <>
            {/* Tabs login / registro (no se muestran en modo "forgot") */}
            {mode !== 'forgot' && (
              <div className="auth-tabs">
                <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Ingresar</button>
                <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Registrarse</button>
              </div>
            )}

            {/* ── REGISTRO ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <label>Nombre del Negocio</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ej. RestSoft" />

                <label>Nombre Completo</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan García" />

                <label>Correo Electrónico</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tuemail@ejemplo.com" />

                <label>Contraseña</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mínimo 6 caracteres" />

                <label>País</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="auth-select">
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.phone})</option>
                  ))}
                </select>

                {/* Campo de teléfono con código de país como prefijo visual */}
                <label>Teléfono</label>
                <div className="phone-input-group">
                  <span className="country-code">{countryData.phone}</span>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} // solo dígitos
                    type="tel"
                    placeholder="1123456789"
                    maxLength="15"
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" type="submit">Crear cuenta</button>
              </form>
            )}

            {/* ── LOGIN ── */}
            {mode === 'login' && !recoveryCode && (
              <form onSubmit={handleLogin} className="auth-form">
                <label>Correo Electrónico</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tuemail@ejemplo.com" />

                <label>Contraseña</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Tu contraseña" />

                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" type="submit">Entrar</button>

                {/* Link para ir al flujo de recuperación de contraseña */}
                <button type="button" className="auth-forgot-btn" onClick={() => { setMode('forgot'); setError(''); setEmail(''); }}>
                  ¿Olvidaste tu contraseña?
                </button>
                <button type="button" className="auth-back-btn" onClick={onBack} style={{ marginTop: '1rem' }}>
                  Volver atrás
                </button>
              </form>
            )}

            {/* ── SOLICITAR CÓDIGO DE RECUPERACIÓN ── */}
            {mode === 'forgot' && !recoveryCode && (
              <form onSubmit={handleForgotRequest} className="auth-form">
                <label>Correo electrónico</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tuemail@ejemplo.com" />

                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" type="submit">Enviar código</button>
                <button type="button" className="auth-back-btn" onClick={() => { setMode('login'); setError(''); setEmail(''); }}>
                  Volver a login
                </button>
              </form>
            )}

            {/* ── INGRESAR CÓDIGO Y NUEVA CONTRASEÑA ── */}
            {/* Se muestra cuando recoveryCode tiene un valor (código ya generado) */}
            {recoveryCode && (
              <form onSubmit={handleResetPassword} className="auth-form">
                {/* Muestra el código generado (en prod se enviaría por email) */}
                <div className="recovery-info">
                  <p>Se envió un código a <strong>{email}</strong></p>
                  <p className="recovery-code">Código: <span>{recoveryCode}</span></p>
                </div>

                <label>Código de verificación</label>
                <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="Ingresa el código" />

                <label>Nueva contraseña</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" />

                <label>Confirmar contraseña</label>
                <input value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} type="password" />

                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" type="submit">Restablecer contraseña</button>
                <button type="button" className="auth-back-btn" onClick={() => {
                  // Cancela el flujo de recuperación y vuelve al login
                  setRecoveryCode(''); setVerifyCode(''); setPassword('');
                  setPasswordConfirm(''); setMode('login'); setError('');
                }}>
                  Cancelar
                </button>
              </form>
            )}
          </>
        )}

        {/* Nota informativa al pie del formulario */}
        <div className="auth-help">
          <small>Tu información está segura y guardada localmente en este navegador.</small>
        </div>
      </div>
    </div>
  );
};

export default Auth;
