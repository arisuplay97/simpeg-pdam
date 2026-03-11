import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import logoPath from "@assets/Logo_Tirta_1773201248263.png";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(username, password);
      setLocation("/");
    } catch (err: any) {
      const msg = err.message || "Login gagal";
      if (msg.includes("401")) {
        setError("Username atau password salah");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-300 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="w-40 h-40 mb-8 bg-white/20 backdrop-blur-sm rounded-3xl p-4 flex items-center justify-center shadow-2xl">
            <img src={logoPath} alt="PDAM Tirta Ardhia Rinjani" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-center">PDAM Tirta Ardhia Rinjani</h1>
          <p className="text-lg text-blue-100 text-center max-w-md mb-8">
            Sistem Informasi Kepegawaian & Manajemen Operasional Internal
          </p>
          <div className="mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold">350+</div>
              <div className="text-sm text-blue-200">Pegawai</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4 bg-primary/10 rounded-2xl p-3 flex items-center justify-center border border-primary/20">
              <img src={logoPath} alt="PDAM Tirta Ardhia Rinjani" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-foreground">PDAM Tirta Ardhia Rinjani</h1>
            <p className="text-sm text-muted-foreground">Sistem Informasi Kepegawaian</p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-login-title">Masuk ke Sistem</h2>
              <p className="text-sm text-muted-foreground mt-1">Silakan masuk dengan akun Anda</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive" data-testid="text-login-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                  required
                  autoFocus
                  data-testid="input-username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="btn-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                data-testid="btn-login"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Akun Demo:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setUsername("admin"); setPassword("admin123"); setError(""); }}
                  className="text-xs px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-center"
                  data-testid="btn-demo-admin"
                >
                  <div className="font-semibold text-foreground">Admin</div>
                  <div className="text-muted-foreground">admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("direktur"); setPassword("direktur123"); setError(""); }}
                  className="text-xs px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-center"
                  data-testid="btn-demo-direktur"
                >
                  <div className="font-semibold text-foreground">Direktur</div>
                  <div className="text-muted-foreground">direktur123</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("doni.alga"); setPassword("pegawai123"); setError(""); }}
                  className="text-xs px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-center"
                  data-testid="btn-demo-pegawai"
                >
                  <div className="font-semibold text-foreground">Pegawai</div>
                  <div className="text-muted-foreground">pegawai123</div>
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            &copy; 2026 PDAM Tirta Ardhia Rinjani. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
