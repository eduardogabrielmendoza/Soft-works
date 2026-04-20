'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Eye, EyeOff, Mail, Check, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

function CuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/cuenta/perfil';
  
  const { signIn, isLoading: authLoading } = useAuth();
  const { config } = useSiteConfig();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [resetError, setResetError] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirmá tu email antes de iniciar sesión');
        } else {
          setError(error.message);
        }
        return;
      }

      router.push(redirect);
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!res.ok) {
        setResetError('Ocurrió un error. Intentá de nuevo.');
        return;
      }

      setResetStep('code');
    } catch {
      setResetError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...resetCode];
    newCode[index] = value.slice(-1);
    setResetCode(newCode);
    setResetError('');
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setResetCode(pasted.split(''));
      codeInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = () => {
    if (resetCode.join('').length !== 6) {
      setResetError('Ingresá el código completo de 6 dígitos');
      return;
    }
    setResetError('');
    setResetStep('password');
  };

  const handleResendCode = async () => {
    setResetLoading(true);
    setResetError('');
    setResetCode(['', '', '', '', '', '']);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
    } catch {
      // silent
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode.join(''),
          password: resetPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('incorrecto')) {
          setResetStep('code');
          setResetError(data.error);
          setResetCode(['', '', '', '', '', '']);
        } else {
          setResetError(data.error || 'Error al actualizar la contraseña');
        }
      } else {
        setResetStep('success');
      }
    } catch {
      setResetError('Error inesperado');
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordChecks = {
    length: resetPassword.length >= 8,
    uppercase: /[A-Z]/.test(resetPassword),
    lowercase: /[a-z]/.test(resetPassword),
    number: /[0-9]/.test(resetPassword),
  };
  const isResetPasswordValid = Object.values(resetPasswordChecks).every(Boolean);
  const resetPasswordsMatch = resetPassword === resetConfirmPassword && resetConfirmPassword.length > 0;

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep('email');
    setResetError('');
    setResetCode(['', '', '', '', '', '']);
    setResetPassword('');
    setResetConfirmPassword('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] rounded-lg overflow-hidden hidden lg:block bg-gray-100"
          >
            {config.login_imagen ? (
              <Image
                src={config.login_imagen}
                alt="Softworks iniciar sesión"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0px, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">SOFTWORKS</div>
            )}
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full px-4 sm:px-0"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 sm:mb-8 text-foreground">
              Iniciar Sesión
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-foreground focus:ring-gray-400 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Mantenerme loggeado</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail(email);
                    setResetStep('email');
                    setResetError('');
                    setResetCode(['', '', '', '', '', '']);
                    setResetPassword('');
                    setResetConfirmPassword('');
                  }}
                  className="text-sm text-gray-600 hover:text-black transition-colors underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿No tenés una cuenta?{' '}
                <Link href="/cuenta/registro" className="text-foreground font-medium hover:underline">
                  Registrate
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeResetModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeResetModal}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {resetStep === 'success' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-medium mb-4">¡Contraseña Actualizada!</h3>
                  <p className="text-gray-600 mb-6">Tu contraseña fue cambiada exitosamente.</p>
                  <button
                    onClick={closeResetModal}
                    className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              ) : resetStep === 'password' ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-medium mb-2">Nueva Contraseña</h3>
                    <p className="text-gray-600 text-sm">Elegí una nueva contraseña para tu cuenta.</p>
                  </div>
                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{resetError}</div>
                  )}
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          required
                          disabled={resetLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                          {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {resetPassword.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {[
                            { ok: resetPasswordChecks.length, text: 'Mínimo 8 caracteres' },
                            { ok: resetPasswordChecks.uppercase, text: 'Una mayúscula' },
                            { ok: resetPasswordChecks.lowercase, text: 'Una minúscula' },
                            { ok: resetPasswordChecks.number, text: 'Un número' },
                          ].map((c) => (
                            <div key={c.text} className={`flex items-center gap-2 text-xs ${c.ok ? 'text-green-600' : 'text-gray-500'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${c.ok ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {c.ok && <Check className="w-3 h-3" />}
                              </div>
                              {c.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        required
                        disabled={resetLoading}
                        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white disabled:opacity-50 ${
                          resetConfirmPassword.length > 0 ? (resetPasswordsMatch ? 'border-green-300 focus:ring-green-400' : 'border-red-300 focus:ring-red-400') : 'border-gray-300 focus:ring-gray-400'
                        }`}
                        placeholder="••••••••"
                      />
                      {resetConfirmPassword.length > 0 && !resetPasswordsMatch && (
                        <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading || !isResetPasswordValid || !resetPasswordsMatch}
                      className="w-full px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Actualizando...</>) : 'Cambiar Contraseña'}
                    </button>
                  </form>
                </>
              ) : resetStep === 'code' ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-medium mb-2">Ingresá el código</h3>
                    <p className="text-gray-600 text-sm">Enviamos un código de 6 dígitos a</p>
                    <p className="font-medium text-foreground">{resetEmail}</p>
                  </div>
                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm text-center">{resetError}</div>
                  )}
                  <div className="flex justify-center gap-2 mb-6" onPaste={handleCodePaste}>
                    {resetCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { codeInputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors ${
                          digit ? 'border-gray-800 bg-gray-50' : resetError ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleVerifyCode}
                    disabled={resetCode.join('').length !== 6}
                    className="w-full px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                  >
                    Verificar Código
                  </button>
                  <div className="text-center space-y-1">
                    <button onClick={handleResendCode} disabled={resetLoading} className="text-sm text-gray-600 hover:text-black transition-colors underline disabled:opacity-50">
                      {resetLoading ? 'Reenviando...' : 'Reenviar código'}
                    </button>
                    <p className="text-xs text-gray-400">El código expira en 15 minutos</p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-medium mb-4">Recuperar Contraseña</h3>
                  <p className="text-gray-700 mb-6">
                    Ingresá tu email y te enviaremos un código de verificación.
                  </p>
                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleResetRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email de la cuenta</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        disabled={resetLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                        placeholder="tu@email.com"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>) : 'Enviar Código'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    }>
      <CuentaContent />
    </Suspense>
  );
}
