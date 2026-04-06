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
  FlaskConical,
  Play,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Landmark,
  Truck,
  FileText,
  MapPin,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Diagnostics {
  email: {
    provider: string;
    apiKeyConfigured: boolean;
    secretKeyConfigured: boolean;
    fromEmail: string;
    fromName: string;
  };
  mercadopago: {
    mode: string;
    accessTokenProductionConfigured: boolean;
    accessTokenProductionPreview: string;
    accessTokenSandboxConfigured: boolean;
    accessTokenSandboxPreview: string;
    tokenSource: string;
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
  { value: 'raw_test', label: 'Test básico (sin template)', description: 'Email simple para verificar que Mailjet funciona' },
  { value: 'order_confirmation', label: 'Pago Exitoso / Aprobado', description: 'Template de pago exitoso (tarjeta) o aprobado (transferencia)' },
  { value: 'order_shipped', label: 'Pedido Enviado', description: 'Template de pedido en camino' },
];

interface TestResult {
  step: string;
  ok: boolean;
  detail: string;
}

interface TestGroup {
  name: string;
  results: TestResult[];
}

const FUNCTIONAL_TESTS = [
  { key: 'products', label: 'Productos CRUD', icon: Package, description: 'Crear, leer, actualizar, toggle destacado, stock, soft delete, hard delete' },
  { key: 'orders', label: 'Pedidos CRUD', icon: ShoppingCart, description: 'Crear pedido + items, cambiar estado, notas admin, info envío, cancelar, eliminar' },
  { key: 'verifications', label: 'Verificaciones de Pago', icon: CreditCard, description: 'Crear verificación, aprobar, rechazar, limpiar' },
  { key: 'users', label: 'Perfiles / Usuarios', icon: Users, description: 'Listar perfiles, leer propio, actualizar teléfono, buscar por email' },
  { key: 'config', label: 'Configuración del Sitio', icon: Settings, description: 'Leer, escribir, re-leer y eliminar configuración' },
  { key: 'bank_accounts', label: 'Cuentas Bancarias', icon: Landmark, description: 'Listar, crear, actualizar, eliminar cuenta bancaria' },
  { key: 'shipping_zones', label: 'Zonas de Envío', icon: Truck, description: 'Listar, crear, actualizar precio, eliminar zona' },
  { key: 'pages', label: 'Contenidos CMS', icon: FileText, description: 'Listar páginas, crear contenido, leer, eliminar' },
  { key: 'addresses', label: 'Direcciones', icon: MapPin, description: 'Listar, crear, actualizar, eliminar dirección' },
  { key: 'rls', label: 'Acceso a Tablas (RLS)', icon: Shield, description: 'Verificar acceso SELECT a todas las tablas' },
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

  // MercadoPago config state
  const [mpTokenProd, setMpTokenProd] = useState('');
  const [mpTokenSandbox, setMpTokenSandbox] = useState('');
  const [mpMode, setMpMode] = useState<'production' | 'sandbox'>('production');
  const [isSavingMP, setIsSavingMP] = useState(false);
  const [mpSaveResult, setMpSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Functional tests state
  const [testResults, setTestResults] = useState<TestGroup[]>([]);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

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

  const handleSaveMPConfig = async () => {
    setIsSavingMP(true);
    setMpSaveResult(null);

    try {
      const payload: Record<string, string> = { action: 'save_mp_config', mode: mpMode };
      if (mpTokenProd.trim()) payload.accessTokenProduction = mpTokenProd.trim();
      if (mpTokenSandbox.trim()) payload.accessTokenSandbox = mpTokenSandbox.trim();

      const res = await fetch('/api/admin/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setMpSaveResult({ success: true, message: 'Configuración guardada correctamente' });
        setMpTokenProd('');
        setMpTokenSandbox('');
        loadDiagnostics();
      } else {
        setMpSaveResult({ success: false, message: data.error || 'Error al guardar' });
      }
    } catch (err: any) {
      setMpSaveResult({ success: false, message: err.message || 'Error de conexión' });
    } finally {
      setIsSavingMP(false);
    }
  };

  const runFunctionalTest = async (testKey: string) => {
    setRunningTest(testKey);
    try {
      const res = await fetch('/api/admin/debug/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: testKey }),
      });
      const data = await res.json();
      if (data.success && data.results) {
        setTestResults(prev => {
          const filtered = prev.filter(g => g.name !== data.results[0].name);
          return [...filtered, ...data.results];
        });
        setExpandedTests(prev => new Set([...prev, data.results[0].name]));
      }
    } catch (err: any) {
      setTestResults(prev => [
        ...prev,
        { name: testKey, results: [{ step: 'Error', ok: false, detail: err.message }] },
      ]);
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    setRunningTest('all');
    setTestResults([]);
    try {
      const res = await fetch('/api/admin/debug/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'all' }),
      });
      const data = await res.json();
      if (data.success && data.results) {
        setTestResults(data.results);
        setExpandedTests(new Set(data.results.map((r: TestGroup) => r.name)));
      }
    } catch (err: any) {
      setTestResults([
        { name: 'Error General', results: [{ step: 'Error', ok: false, detail: err.message }] },
      ]);
    } finally {
      setRunningTest(null);
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const getTestGroupResult = (name: string) => {
    return testResults.find(g => g.name === name);
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
              {/* === MAILJET === */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-medium">Mailjet (Email)</h2>
                  </div>
                  <StatusBadge ok={diagnostics.email.apiKeyConfigured && diagnostics.email.secretKeyConfigured} label={diagnostics.email.apiKeyConfigured && diagnostics.email.secretKeyConfigured ? 'Configurado' : 'Sin configurar'} />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">API Key</p>
                      <p className="font-mono text-sm">{diagnostics.email.apiKeyConfigured ? 'Configurada' : 'NO CONFIGURADA'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Secret Key</p>
                      <p className="font-mono text-sm">{diagnostics.email.secretKeyConfigured ? 'Configurada' : 'NO CONFIGURADA'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From Email</p>
                      <p className="text-sm font-medium">{diagnostics.email.fromEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">From Name</p>
                      <p className="text-sm">{diagnostics.email.fromName}</p>
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
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      diagnostics.mercadopago.mode === 'production' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {diagnostics.mercadopago.mode === 'production' ? 'Producción' : 'Sandbox'}
                    </span>
                    <StatusBadge ok={diagnostics.mercadopago.accessTokenProductionConfigured} label={diagnostics.mercadopago.accessTokenProductionConfigured ? 'Token OK' : 'Sin configurar'} />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Current status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Token Producción</p>
                      <p className="font-mono text-sm">{diagnostics.mercadopago.accessTokenProductionPreview}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Token Sandbox</p>
                      <p className="font-mono text-sm">{diagnostics.mercadopago.accessTokenSandboxPreview}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Origen de tokens</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        diagnostics.mercadopago.tokenSource === 'database' ? 'bg-blue-50 text-blue-700' :
                        diagnostics.mercadopago.tokenSource === 'env' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {diagnostics.mercadopago.tokenSource === 'database' ? 'Base de datos' :
                         diagnostics.mercadopago.tokenSource === 'env' ? 'Variables de entorno' :
                         'No configurado'}
                      </span>
                    </div>
                  </div>

                  {/* Config form */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Configurar MercadoPago</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Modo</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setMpMode('production')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                              mpMode === 'production' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            Producción
                          </button>
                          <button
                            onClick={() => setMpMode('sandbox')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                              mpMode === 'sandbox' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            Sandbox (pruebas)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Access Token Producción</label>
                        <input
                          type="password"
                          value={mpTokenProd}
                          onChange={(e) => setMpTokenProd(e.target.value)}
                          placeholder="APP_USR-... (dejá vacío para no cambiar)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Access Token Sandbox</label>
                        <input
                          type="password"
                          value={mpTokenSandbox}
                          onChange={(e) => setMpTokenSandbox(e.target.value)}
                          placeholder="TEST-... (dejá vacío para no cambiar)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono text-sm"
                        />
                      </div>

                      <button
                        onClick={handleSaveMPConfig}
                        disabled={isSavingMP}
                        className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSavingMP ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Configuración MercadoPago'
                        )}
                      </button>

                      {mpSaveResult && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 ${
                          mpSaveResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          {mpSaveResult.success ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                          <p className={`text-sm ${mpSaveResult.success ? 'text-green-700' : 'text-red-700'}`}>{mpSaveResult.message}</p>
                        </div>
                      )}
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
                  <p className="text-sm text-gray-500 mt-1">Enviá un email de prueba para verificar que Mailjet funciona correctamente</p>
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

              {/* ================================================ */}
              {/* === FUNCTIONAL TESTS === */}
              {/* ================================================ */}
              <div className="bg-white rounded-lg border-2 border-indigo-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h2 className="text-lg font-medium">Tests Funcionales</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Probá todas las operaciones del sistema (CRUD completo, RLS, etc.)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={runAllTests}
                      disabled={runningTest !== null}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {runningTest === 'all' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Ejecutando todos...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Ejecutar Todos
                        </>
                      )}
                    </button>
                  </div>

                  {/* Summary bar */}
                  {testResults.length > 0 && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-green-700 font-medium">
                        {testResults.reduce((acc, g) => acc + g.results.filter(r => r.ok).length, 0)} pasaron
                      </span>
                      <span className="text-red-700 font-medium">
                        {testResults.reduce((acc, g) => acc + g.results.filter(r => !r.ok).length, 0)} fallaron
                      </span>
                      <span className="text-gray-500">
                        de {testResults.reduce((acc, g) => acc + g.results.length, 0)} tests totales
                      </span>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {FUNCTIONAL_TESTS.map((test) => {
                    const Icon = test.icon;
                    const groupResult = getTestGroupResult(
                      FUNCTIONAL_TESTS.find(t => t.key === test.key)?.label || test.key
                    );
                    const isRunning = runningTest === test.key || runningTest === 'all';
                    const isExpanded = groupResult && expandedTests.has(groupResult.name);
                    const allPassed = groupResult?.results.every(r => r.ok);
                    const someFailed = groupResult?.results.some(r => !r.ok);

                    return (
                      <div key={test.key}>
                        <div className="px-6 py-3 flex items-center gap-4">
                          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{test.label}</p>
                            <p className="text-xs text-gray-400 truncate">{test.description}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {groupResult && (
                              <>
                                {allPassed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    {groupResult.results.length}/{groupResult.results.length}
                                  </span>
                                ) : someFailed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                    <XCircle className="w-3 h-3" />
                                    {groupResult.results.filter(r => r.ok).length}/{groupResult.results.length}
                                  </span>
                                ) : null}
                                <button
                                  onClick={() => toggleExpand(groupResult.name)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => runFunctionalTest(test.key)}
                              disabled={runningTest !== null}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isRunning && runningTest === test.key ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              {isRunning && runningTest === test.key ? 'Corriendo...' : 'Ejecutar'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded results */}
                        {groupResult && isExpanded && (
                          <div className="px-6 pb-4">
                            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Paso</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase w-16">Estado</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Detalle</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {groupResult.results.map((r, i) => (
                                    <tr key={i} className={r.ok ? '' : 'bg-red-50/50'}>
                                      <td className="px-3 py-2 font-medium">{r.step}</td>
                                      <td className="px-3 py-2">
                                        {r.ok ? (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 font-mono text-xs break-all">{r.detail}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-3 bg-indigo-50/30 border-t border-indigo-100">
                  <p className="text-xs text-gray-500">
                    Todos los tests crean datos temporales y los eliminan al finalizar. No afectan datos reales.
                  </p>
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
                      <li>• El remitente debe estar verificado en Mailjet (Sender Addresses)</li>
                      <li>• En la cuenta gratuita de Mailjet tenés hasta 6.000 emails/mes (200/día)</li>
                      <li>• Las credenciales deben estar configuradas como MAILJET_API_KEY y MAILJET_SECRET_KEY en Railway</li>
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
