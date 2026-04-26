import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Plus, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { base44 } from '../lib/mockBase44'
import {
  BUDGET_OPTIONS,
  PLATFORM_OPTIONS,
  SKILL_OPTIONS,
  budgetLabel,
  cn,
} from '../lib/utils'

const defaultForm = {
  preferred_platforms: [],
  skill_level: 'Beginner',
  budget: 'any',
  interests: [],
  learning_goal: '',
}

function FieldLabel({ title, description }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function InterestsInput({ interests, draftValue, setDraftValue, onAddInterest, onRemoveInterest }) {
  const handleAdd = () => {
    onAddInterest(draftValue)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      onAddInterest(draftValue)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an interest like machine learning, frontend, or cloud"
          className="bg-white"
        />
        <Button type="button" onClick={handleAdd} className="shrink-0">
          <Plus className="mr-2 size-4" />
          Add topic
        </Button>
      </div>

      {interests.length ? (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant="secondary"
              className="gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground"
            >
              <span>{interest}</span>
              <button
                type="button"
                onClick={() => onRemoveInterest(interest)}
                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${interest}`}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
          No interests added yet. Add a few topics to steer recommendations toward your goals.
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [interestDraft, setInterestDraft] = useState('')
  const [hasHydrated, setHasHydrated] = useState(false)

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: () => base44.entities.UserPreference.get(),
  })

  const saveMutation = useMutation({
    mutationFn: (values) => base44.entities.UserPreference.upsert(values),
    onSuccess: (savedPreferences) => {
      queryClient.setQueryData(['preferences'], savedPreferences)
      toast.success('Preferences saved!')
    },
    onError: () => {
      toast.error('Unable to save preferences right now.')
    },
  })

  if (preferencesQuery.data && !hasHydrated) {
    setForm({
      preferred_platforms: preferencesQuery.data.preferred_platforms || [],
      skill_level: preferencesQuery.data.skill_level || 'Beginner',
      budget: preferencesQuery.data.budget || 'any',
      interests: preferencesQuery.data.interests || [],
      learning_goal: preferencesQuery.data.learning_goal || '',
    })
    setHasHydrated(true)
  }

  const selectedPlatforms = form.preferred_platforms || []

  const selectedSummary = useMemo(() => {
    return {
      platforms: selectedPlatforms.length,
      skill: form.skill_level || 'Beginner',
      budget: budgetLabel(form.budget),
      interests: form.interests.length,
    }
  }, [form.budget, form.interests.length, form.skill_level, selectedPlatforms.length])

  const togglePlatform = (platform) => {
    setForm((current) => {
      const exists = current.preferred_platforms.includes(platform)
      return {
        ...current,
        preferred_platforms: exists
          ? current.preferred_platforms.filter((item) => item !== platform)
          : [...current.preferred_platforms, platform],
      }
    })
  }

  const addInterest = (rawValue) => {
    const cleaned = rawValue.trim().replace(/\s+/g, ' ')
    if (!cleaned) {
      return
    }

    const exists = form.interests.some(
      (item) => item.toLowerCase() === cleaned.toLowerCase(),
    )

    if (exists) {
      setInterestDraft('')
      return
    }

    setForm((current) => ({
      ...current,
      interests: [...current.interests, cleaned],
    }))
    setInterestDraft('')
  }

  const removeInterest = (interest) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.filter((item) => item !== interest),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    saveMutation.mutate({
      preferred_platforms: form.preferred_platforms,
      skill_level: form.skill_level,
      budget: form.budget,
      interests: form.interests,
      learning_goal: form.learning_goal.trim(),
    })
  }

  const isLoading = preferencesQuery.isLoading && !hasHydrated

  return (
    <section className="section-shell space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-70" />

            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                <Sparkles className="size-3.5" />
                Personalization settings
              </div>

              <div className="max-w-3xl space-y-3">
                <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
                  Tune CourseIQ to your learning style
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Set your preferred platforms, level, budget, and topic interests so search
                  results and recommendations align with the pipeline you actually want to follow.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-white/50 bg-white/85 shadow-card backdrop-blur">
            <CardHeader>
              <CardTitle>Learning preferences</CardTitle>
              <CardDescription>
                These settings influence search ranking, saved course suggestions, and your
                recommendation feed.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex min-h-[18rem] items-center justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading your preferences...
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <FieldLabel
                      title="Preferred platforms"
                      description="Select the platforms you want CourseIQ to prioritize when ranking results."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      {PLATFORM_OPTIONS.map((platform) => {
                        const checked = selectedPlatforms.includes(platform)

                        return (
                          <label
                            key={platform}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-all',
                              checked
                                ? 'border-primary/30 bg-primary/5 shadow-sm'
                                : 'border-border bg-background hover:border-primary/20 hover:bg-muted/40',
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => togglePlatform(platform)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{platform}</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Include {platform} in your preferred course sources.
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <FieldLabel
                        title="Skill level"
                        description="Use your current level to improve relevance during ranking."
                      />
                      <Select
                        value={form.skill_level}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            skill_level: event.target.value,
                          }))
                        }
                      >
                        {SKILL_OPTIONS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <FieldLabel
                        title="Budget"
                        description="Price-sensitive ranking uses this budget to downrank expensive matches."
                      />
                      <Select
                        value={form.budget}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            budget: event.target.value,
                          }))
                        }
                      >
                        {BUDGET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel
                      title="Interests"
                      description="Add topics you care about. They help personalize recommendations and discovery suggestions."
                    />
                    <InterestsInput
                      interests={form.interests}
                      draftValue={interestDraft}
                      setDraftValue={setInterestDraft}
                      onAddInterest={addInterest}
                      onRemoveInterest={removeInterest}
                    />
                  </div>

                  <div className="space-y-3">
                    <FieldLabel
                      title="Learning goal"
                      description="Describe the outcome you want, such as preparing for internships, building projects, or mastering a skill."
                    />
                    <Textarea
                      value={form.learning_goal}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          learning_goal: event.target.value,
                        }))
                      }
                      placeholder="Example: I want to build a full-stack AI project, strengthen my DSA fundamentals, and become internship-ready in the next 4 months."
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Save your preferences to personalize search, recommendations, and saved course suggestions.
                    </p>

                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? (
                        <>
                          <LoaderCircle className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save preferences'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/50 bg-white/85 shadow-card backdrop-blur">
            <CardHeader>
              <CardTitle>Preference snapshot</CardTitle>
              <CardDescription>
                A quick summary of the settings currently shaping your experience.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Platforms selected
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {selectedSummary.platforms}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Skill level
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {selectedSummary.skill}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Budget
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {selectedSummary.budget}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Interest tags
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {selectedSummary.interests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/50 bg-white/85 shadow-card backdrop-blur">
            <CardHeader>
              <CardTitle>How this affects results</CardTitle>
              <CardDescription>
                Your preferences map directly to the frontend search and recommendation behavior.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="font-medium text-foreground">Search ranking</p>
                <p className="mt-2">
                  Preferred platforms, budget, and skill level are used in the weighted ranking
                  formula to re-order search results after semantic matching.
                </p>
              </div>

              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="font-medium text-foreground">Recommendations</p>
                <p className="mt-2">
                  Your interests and saved courses influence the content-based, collaborative, and
                  discovery recommendation mix shown on the recommendations page.
                </p>
              </div>

              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="font-medium text-foreground">Saved courses</p>
                <p className="mt-2">
                  Updating preferences helps the app surface more relevant recent discoveries and
                  improves what you are likely to bookmark or complete next.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
