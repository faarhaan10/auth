'use client'
import Button from '@/components/ui/Button'
import { useAxios } from '@/hooks/useAxios'
import { cn } from '@/lib/utils' 
import React, { useEffect, useState } from 'react'

type User = {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
}


function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function StatusDot({ status }: { status: User['status'] }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'
  if (status === 'active') return <span className={`${base} bg-rose-50 text-rose-700`}>Active</span>
  if (status === 'pending') return <span className={`${base} bg-yellow-50 text-yellow-700`}>Pending</span>
  return <span className={`${base} bg-gray-100 text-gray-700`}>Inactive</span>
}

function UserCard({ user }: { user: User }) {
  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-none">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-semibold">
            {initials(user.name)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
        <div className="flex-none">
          <StatusDot status={user.status} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Role</span>
          <div className="mt-1 ms-2 inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-rose-50 text-rose-700">{user.role}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 transition">Message</button>
          <button className="px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">View</button>
        </div>
      </div>
    </article>
  )
}

export default function UsersPage() {
  const [isGridView, setIsGridView] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const axios = useAxios();


  const getUsers = async () => { 
    return await axios.get('/users/all');
  }

  useEffect(() => {
    getUsers().then((data) => {
      setUsers(data.data.data.users);
    });
  }, []);
  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Active members and recent invites — styled to match the sites theme.</p>
      </header>

      <section className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{users.length}</div>
        </div>
        <div className='flex gap-2'> 
          <Button size="sm" 
            onClick={() => setIsGridView(!isGridView)}
          >
            Change view
          </Button>
          <Button size="sm"
          >
            Invite user
          </Button>
        </div>
      </section>

      <section>
        <div className={cn("grid gap-6", isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ' : 'grid-cols-1')}>
          {users.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      </section>
    </main>
  )
}
