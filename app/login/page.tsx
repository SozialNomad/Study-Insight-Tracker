import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border bg-foreground p-8 text-white shadow-soft md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-teal-200">
            Türkçe çalışma paneli
          </p>
          <h1 className="mt-5 font-serif text-5xl font-black tracking-tight md:text-7xl">
            Emek görünür olunca ritim de güçlenir.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/72">
            Günlük çalışma kayıtları, deneme netleri, konu bazlı zayıflıklar ve
            veri uydurmayan AI özetleri tek panelde.
          </p>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
