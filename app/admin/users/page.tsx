import { prisma } from "@/lib/prisma";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const users = await prisma.user.findMany({
    where: {
      role: "TOURIST",
      deletedAt: null,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { touristProfile: { include: { _count: { select: { bookings: true } } } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      <form method="GET" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or email…" className="input max-w-xs" />
        <button className="btn-outline">Search</button>
      </form>
      <div className="card divide-y divide-zinc-100">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{u.name} {u.isSuspended && <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">suspended</span>}</p>
              <p className="text-zinc-500">{u.email} · joined {u.createdAt.toLocaleDateString("en-IN")} · {u.touristProfile?._count.bookings ?? 0} bookings</p>
            </div>
            <UserActions userId={u.id} suspended={u.isSuspended} />
          </div>
        ))}
        {users.length === 0 && <p className="p-6 text-center text-zinc-400">No users found.</p>}
      </div>
    </div>
  );
}
