'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, Check, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function RegistroPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();

  // Step 1: Datos personales | Step 2: Captcha
  const [step, setStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captcha state
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const securityQuestions = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es el nombre de tu mejor amigo/a de la infancia?',
    '¿Cuál fue tu primer auto o medio de transporte?',
    '¿Cuál es tu comida favorita?',
  ];

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer('');
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaImage(data.image);
      setCaptchaToken(data.token);
    } catch {
      setError('Error cargando captcha');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      loadCaptcha();
    }
  }, [step, loadCaptcha]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos');
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!securityQuestion || !securityAnswer.trim()) {
      setError('Completá la pregunta de seguridad');
      return;
    }

    setStep(2);
  };

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Verificar captcha
      const captchaRes = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken, answer: captchaAnswer }),
      });
      const captchaData = await captchaRes.json();

      if (!captchaData.valid) {
        setError(captchaData.error || 'Captcha incorrecto');
        loadCaptcha();
        setIsLoading(false);
        return;
      }

      // Registrar usuario
      const { error: signUpError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        security_question: securityQuestion,
        security_answer: securityAnswer.trim().toLowerCase(),
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado');
        } else {
          setError(signUpError.message);
        }
        setStep(1);
        return;
      }

      // Cuenta creada exitosamente — redirigir al login
      router.push('/cuenta?registered=true');
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">SOFTWORKS</div>
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full px-4 sm:px-0"
          >
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 sm:mb-8 text-foreground">
                    Crear Cuenta
                  </h1>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleStep1Submit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                        <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50" placeholder="Juan" />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                        <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50" placeholder="Pérez" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50" placeholder="tu@email.com" />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <PasswordCheck valid={passwordChecks.length} text="Mínimo 8 caracteres" />
                          <PasswordCheck valid={passwordChecks.uppercase} text="Una letra mayúscula" />
                          <PasswordCheck valid={passwordChecks.lowercase} text="Una letra minúscula" />
                          <PasswordCheck valid={passwordChecks.number} text="Un número" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                      <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading}
                        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white disabled:opacity-50 ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-300 focus:ring-green-400' : 'border-red-300 focus:ring-red-400') : 'border-gray-300 focus:ring-gray-400'}`} placeholder="••••••••" />
                      {confirmPassword.length > 0 && !passwordsMatch && (<p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>)}
                    </div>

                    {/* Pregunta de seguridad */}
                    <div>
                      <label htmlFor="securityQuestion" className="block text-sm font-medium text-gray-700 mb-2">Pregunta de Seguridad</label>
                      <select id="securityQuestion" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} required
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white">
                        <option value="">Seleccioná una pregunta...</option>
                        {securityQuestions.map((q) => (<option key={q} value={q}>{q}</option>))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="securityAnswer" className="block text-sm font-medium text-gray-700 mb-2">Respuesta</label>
                      <input type="text" id="securityAnswer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white" placeholder="Tu respuesta..." />
                      <p className="mt-1 text-xs text-gray-500">Esta pregunta se usará para verificar tu identidad si necesitás recuperar tu contraseña.</p>
                    </div>

                    <button type="submit" disabled={isLoading || !isPasswordValid || !passwordsMatch || !securityQuestion || !securityAnswer.trim()}
                      className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2">
                      Siguiente
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                      ¿Ya tenés una cuenta?{' '}
                      <Link href="/cuenta" className="text-foreground font-medium hover:underline">Ingresá</Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <button onClick={() => { setStep(1); setError(null); }} className="flex items-center gap-1 text-sm text-gray-600 hover:text-black mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-8 h-8 text-foreground" />
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-medium text-foreground">Verificación</h1>
                      <p className="text-sm text-gray-600">Completá el captcha para confirmar tu cuenta</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCaptchaSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-sm font-medium text-gray-700 mb-4">Ingresá el código que ves en la imagen:</p>
                      <div className="flex items-center gap-4 mb-4">
                        {captchaLoading ? (
                          <div className="w-[220px] h-[70px] bg-gray-100 rounded flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          captchaImage && <img src={captchaImage} alt="Captcha" className="rounded border border-gray-200" draggable={false} />
                        )}
                        <button type="button" onClick={loadCaptcha} disabled={captchaLoading} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Nuevo captcha">
                          <RefreshCw className={`w-5 h-5 text-gray-500 ${captchaLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <input type="text" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())} required maxLength={6} autoComplete="off" disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 text-center font-mono text-lg tracking-widest uppercase"
                        placeholder="CÓDIGO" />
                    </div>

                    <button type="submit" disabled={isLoading || captchaAnswer.length < 6}
                      className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2">
                      {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Creando cuenta...</>) : 'Confirmar y Crear Cuenta'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PasswordCheck({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-600' : 'text-gray-500'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${valid ? 'bg-green-100' : 'bg-gray-100'}`}>
        {valid && <Check className="w-3 h-3" />}
      </div>
      {text}
    </div>
  );
}
