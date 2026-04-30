import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, LoaderCircle, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../lib/AuthContext'
import { PLATFORM_OPTIONS, PLATFORM_STYLES, SKILL_OPTIONS, BUDGET_OPTIONS } from '../lib/utils'
import { DEFAULT_PREFERENCES } from '../lib/apiClient'

const TOTAL_STEPS = 3

function StepIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: 'Platforms' },
    { number: 2, label: 'Skill & Budget' },
    { number: 3, label: 'Interests' },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-3">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? <Check className="size-5" /> : step.number}
                </div>
                <span className={`mt-2 text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-3 h-0.5 w-12 sm:w-20 ${currentStep > index ? 'bg-emerald-500' : 'bg-muted'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step1Platforms({ selectedPlatforms, togglePlatform }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Preferred platforms</h2>
        <p className="text-sm text-muted-foreground">
          Select the platforms you want CourseIQ to prioritize. <span className="text-destructive">*Minimum 2 required</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORM_OPTIONS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform)
          const style = PLATFORM_STYLES[platform] || 'border-gray-200 bg-gray-100 text-gray-700'

          return (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`
                flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-200
                ${isSelected
                  ? `border-primary/30 bg-primary/5 shadow-sm ${style.replace('border-', 'ring-2 ring-primary/20')}`
                  : 'border-border bg-background hover:border-primary/20 hover:bg-muted/40'
                }
              `}
            >
              <div
                className={`
                  mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all
                  ${isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted-foreground/30'
                  }
                `}
              >
                {isSelected && <Check className="size-3" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{platform}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Include {platform} in your course sources
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Selected:</span>
          {selectedPlatforms.map((platform) => (
            <Badge
              key={platform}
              variant="secondary"
              className="gap-1 rounded-full border border-border bg-white px-3 py-1 text-sm"
            >
              <Check className="size-3 text-emerald-600" />
              {platform}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function Step2SkillBudget({ skillLevel, setSkillLevel, budget, setBudget }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Skill level & budget</h2>
        <p className="text-sm text-muted-foreground">
          These preferences help refine the ranking of course results.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium">Skill level</label>
          <Select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
          >
            <SelectItem value="">Select your level</SelectItem>
            {SKILL_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">Optional</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Budget preference</label>
          <Select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <SelectItem value="">Select budget range</SelectItem>
            {BUDGET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">Optional</p>
        </div>
      </div>
    </div>
  )
}

function Step3Interests({ interests, addInterest, removeInterest, learningGoal, setLearningGoal }) {
  const [draftInterest, setDraftInterest] = useState('')

  const handleAddInterest = () => {
    const cleaned = draftInterest.trim()
    if (!cleaned) return

    const exists = interests.some((i) => i.toLowerCase() === cleaned.toLowerCase())
    if (exists) {
      toast.error('This interest is already added')
      setDraftInterest('')
      return
    }

    addInterest(cleaned)
    setDraftInterest('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddInterest()
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Interests & learning goal</h2>
        <p className="text-sm text-muted-foreground">
          This helps us personalize your recommendations. Everything here is optional.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Interests (topics you care about)</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Add an interest like machine learning, frontend, cloud..."
            value={draftInterest}
            onChange={(e) => setDraftInterest(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            onClick={handleAddInterest}
            className="shrink-0"
          >
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>

        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground"
              >
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${interest}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Learning goal</label>
        <Textarea
          placeholder="Describe your goal: e.g., Build production-ready AI products, strengthen DSA fundamentals, become internship-ready..."
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, completePreferences } = useAuth()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [showPreferences, setShowPreferences] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState({
    preferred_platforms: [],
    skill_level: '',
    budget: '',
    interests: [],
    learning_goal: '',
  })

  const [errors, setErrors] = useState({})

  const togglePlatform = (platform) => {
    setErrors((current) => ({ ...current, platforms: undefined }))
    setPreferences((prev) => {
      const exists = prev.preferred_platforms.includes(platform)
      return {
        ...prev,
        preferred_platforms: exists
          ? prev.preferred_platforms.filter((p) => p !== platform)
          : [...prev.preferred_platforms, platform],
      }
    })
  }

  const addInterest = (interest) => {
    setPreferences((prev) => ({
      ...prev,
      interests: [...prev.interests, interest],
    }))
  }

  const removeInterest = (interest) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }))
  }

  const validatePersonalDetails = () => {
    const newErrors = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validatePersonalDetails()) {
      setShowPreferences(true)
    }
  }

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep === 1) {
      setShowPreferences(false)
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleFinalSubmit = async () => {
    setIsLoading(true)

    try {
      await register({ full_name: name.trim(), password })

      const finalPreferences = {
        preferred_platforms:
          preferences.preferred_platforms.length > 0
            ? preferences.preferred_platforms
            : DEFAULT_PREFERENCES.preferred_platforms,
        skill_level: preferences.skill_level || DEFAULT_PREFERENCES.skill_level,
        budget: preferences.budget || DEFAULT_PREFERENCES.budget,
        interests:
          preferences.interests.length > 0
            ? preferences.interests
            : DEFAULT_PREFERENCES.interests,
        learning_goal:
          preferences.learning_goal.trim() || DEFAULT_PREFERENCES.learning_goal,
      }

      await completePreferences(finalPreferences)

      toast.success('Registration successful!')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const [animDirection, setAnimDirection] = useState(0)

  const handleNext = () => {
    if (currentStep === 1 && preferences.preferred_platforms.length < 2) {
      setErrors((current) => ({
        ...current,
        platforms: 'Select at least 2 platforms to continue',
      }))
      return
    }

    setAnimDirection(1)
    goNext()
  }

  const handleBack = () => {
    setAnimDirection(-1)
    goBack()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-xl p-8 sm:p-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your profile and preferences to get started
          </p>
        </div>

        {!showPreferences ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal details</h2>
              <p className="text-sm text-muted-foreground">
                Enter your name and set a password to continue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              fullWidth
              onClick={handleContinue}
              disabled={isLoading}
              size="lg"
            >
              Continue
            </Button>
          </div>
        ) : (
          <>
            <StepIndicator currentStep={currentStep} />

            <div className="mb-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={animDirection}>
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={animDirection}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative"
                  >
                    <Step1Platforms
                      selectedPlatforms={preferences.preferred_platforms}
                      togglePlatform={togglePlatform}
                    />
                    {errors.platforms && (
                      <p className="mt-2 text-sm text-destructive">{errors.platforms}</p>
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={animDirection}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative"
                  >
                    <Step2SkillBudget
                      skillLevel={preferences.skill_level}
                      setSkillLevel={(val) => setPreferences((p) => ({ ...p, skill_level: val }))}
                      budget={preferences.budget}
                      setBudget={(val) => setPreferences((p) => ({ ...p, budget: val }))}
                    />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={animDirection}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative"
                  >
                    <Step3Interests
                      interests={preferences.interests}
                      addInterest={addInterest}
                      removeInterest={removeInterest}
                      learningGoal={preferences.learning_goal}
                      setLearningGoal={(val) => setPreferences((p) => ({ ...p, learning_goal: val }))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>

              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={handleNext}
                >
                  Continue
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Complete registration
                      <Sparkles className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?{' '}
          </span>
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
