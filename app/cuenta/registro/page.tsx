'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function RegistroPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Validaciones de contraseña
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleRegister = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email ya está registrado');
        } else {
          setError(error.message);
        }
        return;
      }

      setShowSuccessModal(true);
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
            className="relative aspect-[4/5] rounded-lg overflow-hidden hidden lg:block"
          >
            <Image
              src="/images/mision.png"
              alt="Softworks"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full px-4 sm:px-0"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 sm:mb-8 text-foreground">
              Crear Cuenta
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                    placeholder="Pérez"
                  />
                </div>
              </div>

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
                
                {/* Password requirements */}
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
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
                    Creando cuenta...
                  </>
                ) : (
                  'Registrarme'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tenés una cuenta?{' '}
                <Link href="/cuenta" className="text-foreground font-medium hover:underline">
                  Ingresá
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-8 relative text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-2xl font-medium mb-4">¡Cuenta Creada!</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Te enviamos un email a <strong>{email}</strong> para verificar tu cuenta.
                Por favor revisá tu bandeja de entrada y hacé click en el enlace de confirmación.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Si no lo encontrás, revisá tu carpeta de spam.
              </p>
              <button
                onClick={() => router.push('/cuenta')}
                className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
              >
                Ir a Iniciar Sesión
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
