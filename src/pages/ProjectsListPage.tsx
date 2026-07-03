import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { FolderKanban, Plus, Filter, ArrowUpDown, TrendingUp, Bug, Zap } from 'lucide-react'
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
          <button className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md transition-colors shadow-sm hidden">
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

// Generate deterministic mock data based on project ID so it stays consistent
function generateMockData(id: string) {
  const num = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  const leads = [
    { name: 'Jordan S.', avatar: 'https://i.pravatar.cc/150?img=11' },
    { name: 'Elena G.', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Marcus L.', avatar: 'https://i.pravatar.cc/150?img=33' },
    { name: 'Sarah K.', avatar: 'https://i.pravatar.cc/150?img=47' },
  ]
  const lead = leads[num % leads.length]
  const progress = 20 + (num % 80) // 20-99%
  const memberCount = 2 + (num % 8)
  const isArchived = (num % 10) > 8 // 10% chance to be archived
  
  return { lead, progress, memberCount, isArchived }
}

export default function ProjectsListPage() {
  const { t } = useTranslation()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const projects = useAppSelector((state) => state.project.items)
  const isLoading = useAppSelector((state) => state.project.isLoading)

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
            <button className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <Filter className="size-4 text-slate-400" />
              Filter
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowUpDown className="size-4 text-slate-400" />
              Sort
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a1c] shadow-lg mb-8 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#1e1e20] text-[11px] font-bold tracking-widest uppercase text-slate-500">
            <div className="col-span-4 pl-2">PROJECT NAME</div>
            <div className="col-span-3">LEAD</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-2">PROGRESS</div>
            <div className="col-span-1">MEMBERS</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-4"><Skeleton className="h-10 w-full bg-white/5" /></div>
                  <div className="col-span-3"><Skeleton className="h-8 w-32 bg-white/5" /></div>
                  <div className="col-span-2"><Skeleton className="h-6 w-16 bg-white/5" /></div>
                  <div className="col-span-2"><Skeleton className="h-2 w-full bg-white/5" /></div>
                  <div className="col-span-1"><Skeleton className="h-8 w-16 bg-white/5" /></div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderKanban className="size-12 text-white/10 mb-4" />
                <p className="text-sm text-slate-400 mb-4">{t('projects.empty')}</p>
              </div>
            ) : (
              projects.map((project) => {
                const mock = generateMockData(project.id)
                return (
                  <Link
                    key={project.id}
                    to={`/w/${workspaceSlug}/p/${project.id}/issues`}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    {/* Name */}
                    <div className="col-span-4 flex items-center gap-4 pl-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <FolderKanban className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{project.name}</p>
                        <p className="text-[12px] text-slate-500 truncate">{project.description || `${project.identifier} / Core Product`}</p>
                      </div>
                    </div>

                    {/* Lead */}
                    <div className="col-span-3 flex items-center gap-3">
                      <img src={mock.lead.avatar} alt={mock.lead.name} className="size-6 rounded-full object-cover ring-2 ring-[#1a1a1c]" />
                      <span className="text-sm text-slate-300 font-medium">{mock.lead.name}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      {mock.isArchived ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-span-2 flex items-center gap-3 pr-4">
                      <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${mock.isArchived ? 'bg-slate-500' : 'bg-indigo-400'}`} 
                          style={{ width: `${mock.progress}%` }} 
                        />
                      </div>
                      <span className="text-[12px] font-medium text-slate-400 w-8 text-right">{mock.progress}%</span>
                    </div>

                    {/* Members */}
                    <div className="col-span-1 flex items-center">
                      <div className="flex -space-x-2">
                        <img src="https://i.pravatar.cc/100?img=12" className="size-6 rounded-full object-cover ring-2 ring-[#1a1a1c] z-20" />
                        <img src="https://i.pravatar.cc/100?img=33" className="size-6 rounded-full object-cover ring-2 ring-[#1a1a1c] z-10" />
                        <div className="size-6 rounded-full bg-white/10 ring-2 ring-[#1a1a1c] flex items-center justify-center text-[9px] font-bold text-slate-300 z-0">
                          +{mock.memberCount}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Velocity</span>
              <TrendingUp className="size-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-100 mb-2">+24%</div>
            <div className="text-xs text-slate-400">Productivity increase this quarter</div>
          </div>
          
          <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Open Issues</span>
              <Bug className="size-4 text-red-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-100 mb-2">{projects.length > 0 ? (projects.length * 42) : 142}</div>
            <div className="text-xs text-slate-400">Active tasks across all projects</div>
          </div>
          
          <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Resource Usage</span>
              <Zap className="size-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-100 mb-2">88%</div>
            <div className="text-xs text-slate-400">Efficient team allocation achieved</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-6 border-t border-white/5 mt-auto">
          <p className="text-xs text-slate-500">© 2024 DeepLogic. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <button className="hover:text-slate-200 transition-colors">Privacy Policy</button>
            <button className="hover:text-slate-200 transition-colors">Term of Service</button>
            <button className="hover:text-slate-200 transition-colors">Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  )
}
