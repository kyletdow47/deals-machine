"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <span className="text-primary font-label font-bold uppercase tracking-[0.2em] text-[10px]">Configuration</span>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mt-1">Settings</h1>
        <p className="text-on-surface-variant mt-2">Configure your Deals Machine instance.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* API Keys */}
          <section className="bg-surface-container-highest rounded-xl p-8 editorial-shadow border border-outline-variant/5">
            <h3 className="font-headline font-bold text-xl mb-6">Integrations</h3>
            <div className="space-y-6">
              {[
                { label: "Apollo.io API Key", desc: "Lead enrichment and sourcing", icon: "travel_explore" },
                { label: "HubSpot API Key", desc: "CRM sync", icon: "hub" },
                { label: "Supabase URL", desc: "Database connection", icon: "storage" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-semibold">{item.desc}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-[10px] font-bold uppercase text-on-secondary-container">Configured</span>
                </div>
              ))}
            </div>
          </section>

          {/* Automation */}
          <section className="bg-surface-container-highest rounded-xl p-8 editorial-shadow border border-outline-variant/5">
            <h3 className="font-headline font-bold text-xl mb-6">Automation</h3>
            <div className="space-y-6">
              {[
                { label: "Auto-enrich new leads", desc: "Run intelligence agent on import", checked: true },
                { label: "Auto-score leads", desc: "AI scoring on new data", checked: false },
                { label: "Follow-up nudges", desc: "Surface stale leads on dashboard", checked: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{item.label}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-semibold">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-high rounded-xl p-6">
            <h4 className="text-xs font-black font-headline uppercase tracking-widest text-primary mb-4">System</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Version</span><span className="font-bold">2.0.0</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Database</span><span className="font-bold">Supabase</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Hosting</span><span className="font-bold">Vercel</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
