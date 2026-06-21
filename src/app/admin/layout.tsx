import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware sudah menangani redirect untuk route admin biasa,
  // tapi layout ini juga dipakai sebagai pengaman kedua (defense in depth).
  if (!user) {
    redirect("/admin/login");
  }

  // Ambil nama profil admin (jika ada)
  const { data: profile } = await supabase
    .from("ssc_admin_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-[#F8F4F0] font-sans">
      <AdminSidebar
        userEmail={user.email || ""}
        fullName={profile?.full_name || "Admin"}
        role={profile?.role || "staff"}
      />
      <div className="flex-1 min-w-0 lg:ml-64">{children}</div>
    </div>
  );
}