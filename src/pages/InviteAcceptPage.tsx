import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/shared/Loader'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { acceptInvite, fetchInviteByToken } from '@/features/invite/inviteSlice'

export default function InviteAcceptPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const invite = useAppSelector((state) => state.invite.current)
  const isLoading = useAppSelector((state) => state.invite.isLoading)
  const error = useAppSelector((state) => state.invite.error)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    if (token) void dispatch(fetchInviteByToken(token))
  }, [token, dispatch])

  async function handleAccept() {
    if (!token || !invite) return
    setIsAccepting(true)
    try {
      await dispatch(acceptInvite(token)).unwrap()
      toast.success(`Joined ${invite.workspace.name}`)
      navigate(`/w/${invite.workspace.slug}`, { replace: true })
    } catch {
      toast.error('Could not accept this invite')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) return <Loader />

  if (error || !invite) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-4 text-center text-foreground">
        <h1 className="text-lg font-semibold">Invite not found</h1>
        <p className="text-sm text-muted-foreground">This invite link is invalid or has expired.</p>
        <Link to="/" className="text-sm text-primary underline">
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Building2 className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Join {invite.workspace.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invite.invited_by.display_name} invited you to join as {invite.role} on Task Management.
          </p>
        </div>

        {isAuthenticated ? (
          <Button className="w-full" onClick={() => void handleAccept()} disabled={isAccepting}>
            {isAccepting ? 'Joining...' : 'Accept invite'}
          </Button>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" render={<Link to={`/register?redirect=/invite/${token}`} />}>
              Create an account to join
            </Button>
            <Button variant="outline" className="w-full" render={<Link to={`/login?redirect=/invite/${token}`} />}>
              Log in to join
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
