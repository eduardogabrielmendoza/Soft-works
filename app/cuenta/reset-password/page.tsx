'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, Check, Mail, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();

  // Flow state: 'email' → 'code' → 'password' → 'success'
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');

  // Email step
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Code step
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password step
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Step 1: Request code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError('Error inesperado');
        return;
      }

      setStep('code');
    } catch {
      setError('Error inesperado');
    } finally {
      setEmailLoading(false);
    }
  };

  // Code input handlers
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setCodeError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify code (just moves to password step — actual verification happens on submit)
  const handleVerifyCode = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setCodeError('Ingresá el código completo de 6 dígitos');
      return;
    }
    setCodeError(null);
    setStep('password');
  };

  // Step 3: Submit new password (code verified server-side)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.join(''),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('incorrecto')) {
          setStep('code');
          setCodeError(data.error);
          setCode(['', '', '', '', '', '']);
        } else {
          setError(data.error || 'Error al actualizar la contraseña');
        }
      } else {
        setStep('success');
        setTimeout(() => router.push('/cuenta'), 3000);
      }
    } catch {
      setError('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setEmailLoading(true);
    setCodeError(null);
    setCode(['', '', '', '', '', '']);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCodeError(null);
    } catch {
      // silent
    } finally {
      setEmailLoading(false);
    }
  };

  // =============================================
  // SUCCESS
  // =============================================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium mb-4">¡Contraseña Actualizada!</h1>
            <p className="text-gray-600 mb-2">Tu contraseña fue cambiada exitosamente.</p>
            <p className="text-sm text-gray-500">Redirigiendo al login...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-md mx-auto px-4 py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-8 shadow-sm"
        >
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => {
              const stepIndex = s === 1 ? 'email' : s === 2 ? 'code' : 'password';
              const stepOrder = { email: 1, code: 2, password: 3, success: 4 };
              const current = stepOrder[step];
              const isCompleted = current > s;
              const isActive = current === s;

              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP 1: Email */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="text-2xl font-medium mb-2">Recuperar Contraseña</h1>
              <p className="text-gray-600 mb-8">
                Ingresá tu email y te enviaremos un código de verificación.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                    placeholder="tu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Código'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Code */}
          {step === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-medium mb-2">Ingresá el código</h1>
                <p className="text-gray-600 text-sm">
                  Enviamos un código de 6 dígitos a
                </p>
                <p className="font-medium text-foreground">{email}</p>
              </div>

              {codeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm text-center">
                  {codeError}
                </div>
              )}

              <div className="flex justify-center gap-2 mb-6" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors ${
                      digit
                        ? 'border-gray-800 bg-gray-50'
                        : codeError
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={code.join('').length !== 6}
                className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
              >
                Verificar Código
              </button>

              <div className="text-center space-y-2">
                <button
                  onClick={handleResend}
                  disabled={emailLoading}
                  className="text-sm text-gray-600 hover:text-black transition-colors underline disabled:opacity-50"
                >
                  {emailLoading ? 'Reenviando...' : 'Reenviar código'}
                </button>
                <p className="text-xs text-gray-400">El código expira en 15 minutos</p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: New Password */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-medium mb-2">Nueva Contraseña</h1>
                <p className="text-gray-600 text-sm">
                  Elegí una nueva contraseña para tu cuenta.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
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
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <PwCheck ok={passwordChecks.length} text="Mínimo 8 caracteres" />
                      <PwCheck ok={passwordChecks.uppercase} text="Una mayúscula" />
                      <PwCheck ok={passwordChecks.lowercase} text="Una minúscula" />
                      <PwCheck ok={passwordChecks.number} text="Un número" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white disabled:opacity-50 ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-green-300 focus:ring-green-400'
                          : 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-gray-400'
                    }`}
                    placeholder="••••••••"
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/cuenta"
              className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PwCheck({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}>
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          ok ? 'bg-green-100' : 'bg-gray-100'
        }`}
      >
        {ok && <Check className="w-3 h-3" />}
      </div>
      {text}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F0] pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
