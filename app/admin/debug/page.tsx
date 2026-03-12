'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Loader2,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Globe,
  CreditCard,
  Bug,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Diagnostics {
  sendgrid: {
    apiKeyConfigured: boolean;
    apiKeyPreview: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
  };
  mercadopago: {
    accessTokenConfigured: boolean;
    accessTokenPreview: string;
    sandboxTokenConfigured: boolean;
    publicKey: string;
  };
  site: {
    siteUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
  database: {
    connected: boolean;
    pedidos?: number;
    productos?: number;
    usuarios?: number;
    error?: string;
  };
}

const EMAIL_TYPES = [
  { value: 'raw_test', label: 'Test básico (sin template)', description: 'Email simple para verificar que SendGrid funciona' },
  { value: 'payment_approved', label: 'Pago Aprobado', description: 'Template de confirmación de pago' },
  { value: 'order_shipped', label: 'Pedido Enviado', description: 'Template de pedido en camino' },
  { value: 'order_delivered', label: 'Pedido Entregado', description: 'Template de pedido entregado' },
  { value: 'payment_rejected', label: 'Pago Rechazado', description: 'Template de pago rechazado' },
  { value: 'welcome', label: 'Bienvenida', description: 'Template de registro exitoso' },
];

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

export default function AdminDebugPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isLoadingDiag, setIsLoadingDiag] = useState(true);
  const [diagError, setDiagError] = useState<string | null>(null);

  // Email test state
  const [emailTo, setEmailTo] = useState('');
  const [emailType, setEmailType] = useState('raw_test');
  const [isSending, setIsSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/cuenta');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadDiagnostics();
    }
  }, [isAdmin]);

  const loadDiagnostics = async () => {
    setIsLoadingDiag(true);
    setDiagError(null);
    try {
      const res = await fetch('/api/admin/debug');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDiagnostics(data.diagnostics);
    } catch (err: any) {
      setDiagError(err.message);
    } finally {
      setIsLoadingDiag(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!emailTo.trim()) {
      setEmailResult({ success: false, message: 'Ingresá un email destinatario' });
      return;
    }

    setIsSending(true);
    setEmailResult(null);

    try {
      const res = await fetch('/api/admin/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_email',
          emailTo: emailTo.trim(),
          emailType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEmailResult({
          success: true,
          message: `Email "${EMAIL_TYPES.find(t => t.value === emailType)?.label}" enviado exitosamente a ${emailTo}`,
        });
      } else {
        setEmailResult({
          success: false,
          message: data.error || 'Error al enviar el email',
        });
      }
    } catch (err: any) {
      setEmailResult({
        success: false,
        message: err.message || 'Error de conexión',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin"
                className="text-sm text-gray-500 hover:text-foreground flex items-center gap-1 mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
                <Bug className="w-7 h-7" />
                Debug y Diagnósticos
              </h1>
              <p className="text-gray-500 mt-1">Verificá el estado de todos los servicios del sistema</p>
            </div>
            <button
              onClick={loadDiagnostics}
              disabled={isLoadingDiag}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDiag ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {diagError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700">Error cargando diagnósticos: {diagError}</p>
            </div>
          )}

          {isLoadingDiag && !diagnostics ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
          ) : diagnostics ? (
            <div className="space-y-6">
              {/* === SENDGRID === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-medium">SendGrid (Email)</h2>
                  </div>
                  <StatusBadge ok={diagnostics.sendgrid.apiKeyConfigured} label={diagnostics.sendgrid.apiKeyConfigured ? 'Configurado' : 'Sin configurar'} />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">API Key</p>
                      <p className="font-mono text-sm">{diagnostics.sendgrid.apiKeyPreview}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From Email</p>
                      <p className="text-sm font-medium">{diagnostics.sendgrid.fromEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From Name</p>
                      <p className="text-sm">{diagnostics.sendgrid.fromName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reply To</p>
                      <p className="text-sm">{diagnostics.sendgrid.replyTo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* === MERCADOPAGO === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-medium">MercadoPago</h2>
                  </div>
                  <StatusBadge ok={diagnostics.mercadopago.accessTokenConfigured} label={diagnostics.mercadopago.accessTokenConfigured ? 'Producción OK' : 'Sin configurar'} />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Access Token (Producción)</p>
                      <p className="font-mono text-sm">{diagnostics.mercadopago.accessTokenPreview}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Token Sandbox</p>
                      <StatusBadge ok={diagnostics.mercadopago.sandboxTokenConfigured} label={diagnostics.mercadopago.sandboxTokenConfigured ? 'Configurado' : 'Sin configurar'} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Public Key</p>
                      <p className="font-mono text-sm">{diagnostics.mercadopago.publicKey}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* === SITE CONFIG === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-medium">Configuración del Sitio</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Site URL</p>
                      <p className="text-sm font-medium">{diagnostics.site.siteUrl}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Supabase</p>
                      <StatusBadge ok={diagnostics.site.supabaseUrl === 'Configurada'} label={diagnostics.site.supabaseUrl} />
                    </div>
                  </div>
                </div>
              </div>

              {/* === DATABASE === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-medium">Base de Datos</h2>
                  </div>
                  <StatusBadge ok={diagnostics.database.connected} label={diagnostics.database.connected ? 'Conectada' : 'Error'} />
                </div>
                <div className="p-6">
                  {diagnostics.database.connected ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">{diagnostics.database.pedidos}</p>
                        <p className="text-xs text-gray-500 mt-1">Pedidos</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">{diagnostics.database.productos}</p>
                        <p className="text-xs text-gray-500 mt-1">Productos</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">{diagnostics.database.usuarios}</p>
                        <p className="text-xs text-gray-500 mt-1">Usuarios</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">{diagnostics.database.error}</p>
                  )}
                </div>
              </div>

              {/* === TEST EMAIL === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-medium">Enviar Email de Prueba</h2>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Enviá un email de prueba para verificar que SendGrid funciona correctamente</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email destinatario
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="tucorreo@gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de email
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EMAIL_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setEmailType(type.value)}
                          className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                            emailType === type.value
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSending || !emailTo.trim()}
                    className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Email de Prueba
                      </>
                    )}
                  </button>

                  {emailResult && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                      emailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {emailResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${emailResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {emailResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* === TIPS === */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 mb-2">Consejos para emails</h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Si los emails no llegan, revisá la carpeta de spam</li>
                      <li>• El remitente debe coincidir con el dominio autenticado en SendGrid</li>
                      <li>• Verificá que el Sender Identity esté verificado en SendGrid</li>
                      <li>• Los registros DNS (SPF/DKIM) deben estar configurados en Cloudflare</li>
                      <li>• Si usás Email Routing de Cloudflare, verificá que esté activo</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
