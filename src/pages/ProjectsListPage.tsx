import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { FolderKanban, Plus, ArrowUpDown, FolderCheck, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { createProject } from '@/features/project/projectSlice'
import { fetchWorkspaceMembers } from '@/features/workspace/workspaceMembersSlice'

function identifierFromName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 6)
    .toUpperCase()
}

function CreateProjectDialog({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [identifierTouched, setIdentifierTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!identifierTouched) setIdentifier(identifierFromName(value))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(createProject({ workspaceSlug, payload: { name, identifier, description } })).unwrap()
      setOpen(false)
      setName('')
      setIdentifier('')
      setIdentifierTouched(false)
      setDescription('')
    } catch {
      setError(t('projects.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md transition-colors shadow-sm flex items-center">
            <Plus className="size-4 inline-block mr-1" />
            {t('projects.create')}
          </button>
        }
      />
      <DialogContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
        <DialogHeader>
          <DialogTitle>{t('projects.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-sm font-medium text-slate-400">
              {t('projects.name')}
            </label>
            <Input id="project-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} className="bg-[#141517] border-white/10 text-slate-200" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-identifier" className="text-sm font-medium text-slate-400">
              {t('projects.identifier')}
            </label>
            <Input
              id="project-identifier"
              required
              maxLength={6}
              value={identifier}
              onChange={(e) => {
                setIdentifierTouched(true)
                setIdentifier(e.target.value.toUpperCase())
              }}
              className="bg-[#141517] border-white/10 text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-description" className="text-sm font-medium text-slate-400">
              {t('projects.description')}
            </label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#141517] border-white/10 text-slate-200 min-h-[100px]"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              {isSubmitting ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type SortMode = 'name' | 'status'

export default function ProjectsListPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const projects = useAppSelector((state) => state.project.items)
  const isLoading = useAppSelector((state) => state.project.isLoading)
  const members = useAppSelector((state) => state.workspaceMembers.items)
  const [sortMode, setSortMode] = useState<SortMode>('name')
  const [showArchived, setShowArchived] = useState(true)

  useEffect(() => {
    if (workspaceSlug && members.length === 0) void dispatch(fetchWorkspaceMembers(workspaceSlug))
  }, [workspaceSlug, members.length, dispatch])

  const membersById = useMemo(() => new Map(members.map((m) => [m.user_id, m.user])), [members])

  const visibleProjects = useMemo(() => {
    const filtered = showArchived ? projects : projects.filter((p) => !p.is_archived)
    return [...filtered].sort((a, b) => {
      if (sortMode === 'status') {
        if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1
      }
      return a.name.localeCompare(b.name)
    })
  }, [projects, showArchived, sortMode])

  const activeCount = projects.filter((p) => !p.is_archived).length
  const archivedCount = projects.length - activeCount

  return (
    <div className="flex h-full bg-background flex-col overflow-y-auto">
      <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-3">Projects</h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Manage and monitor the progress of all ongoing initiatives across the engineering and design departments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {workspaceSlug && <CreateProjectDialog workspaceSlug={workspaceSlug} />}
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                showArchived
                  ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
                  : 'text-slate-300 bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Archive className="size-4" />
              {showArchived ? 'Showing archived' : 'Archived hidden'}
            </button>
            <button
              onClick={() => setSortMode((m) => (m === 'name' ? 'status' : 'name'))}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowUpDown className="size-4 text-slate-400" />
              Sort: {sortMode === 'name' ? 'Name' : 'Status'}
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a1c] shadow-lg mb-8 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#1e1e20] text-[11px] font-bold tracking-widest uppercase text-slate-500">
            <div className="col-span-5 pl-2">PROJECT NAME</div>
            <div className="col-span-4">LEAD</div>
            <div className="col-span-3">STATUS</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-5"><Skeleton className="h-10 w-full bg-white/5" /></div>
                  <div className="col-span-4"><Skeleton className="h-8 w-32 bg-white/5" /></div>
                  <div className="col-span-3"><Skeleton className="h-6 w-16 bg-white/5" /></div>
                </div>
              ))
            ) : visibleProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderKanban className="size-12 text-white/10 mb-4" />
                <p className="text-sm text-slate-400 mb-4">{t('projects.empty')}</p>
              </div>
            ) : (
              visibleProjects.map((project) => {
                const lead = project.lead_id ? membersById.get(project.lead_id) : undefined
                return (
                  <Link
                    key={project.id}
                    to={`/w/${workspaceSlug}/p/${project.id}/issues`}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    {/* Name */}
                    <div className="col-span-5 flex items-center gap-4 pl-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FolderKanban className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{project.name}</p>
                        <p className="text-[12px] text-slate-500 truncate">{project.description || project.identifier}</p>
                      </div>
                    </div>

                    {/* Lead */}
                    <div className="col-span-4 flex items-center gap-3">
                      {lead ? (
                        <>
                          <div className="size-6 rounded-full overflow-hidden bg-slate-700 shrink-0">
                            {lead.avatar_url ? (
                              <img src={lead.avatar_url} alt={lead.display_name} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-[9px] font-bold text-white bg-indigo-500">
                                {lead.display_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-slate-300 font-medium">{lead.display_name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-500">No lead assigned</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-3 flex items-center">
                      {project.is_archived ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Active Projects</span>
              <FolderCheck className="size-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-100 mb-2">{activeCount}</div>
            <div className="text-xs text-slate-400">of {projects.length} total projects</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Archived Projects</span>
              <Archive className="size-4 text-slate-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-100 mb-2">{archivedCount}</div>
            <div className="text-xs text-slate-400">Hidden from active views</div>
          </div>
        </div>
      </div>
    </div>
  )
}
