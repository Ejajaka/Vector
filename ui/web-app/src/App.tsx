import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ActiveTab, AnalysisResult } from './types/analysis.ts';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ProjectProvider, useProject } from './context/ProjectContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { PublicHeader } from './components/layout/PublicHeader.tsx';
import { Logo } from './components/ui/Logo.tsx';
import { PublicFooter } from './components/layout/PublicFooter.tsx';
import { AuthPage } from './components/auth/AuthPage.tsx';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage.tsx';
import { ProductTour, resetTour } from './components/onboarding/ProductTour.tsx';
import { WelcomeDialog } from './components/onboarding/WelcomeDialog.tsx';
import { GuidedTour, type GuidePage } from './components/onboarding/GuidedTour.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { TemplatesPage } from './pages/TemplatesPage.tsx';
import { LearnPage } from './pages/LearnPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { NewAnalysisPage } from './pages/NewAnalysisPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { DesignSystemsPage } from './pages/DesignSystemsPage.tsx';
import { ManualPage } from './pages/ManualPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { LibraryPage } from './pages/LibraryPage.tsx';
import { PromptModePage } from './pages/PromptModePage.tsx';
import { RequirementsPage } from './pages/RequirementsPage.tsx';
import { RequirementGraphPage } from './pages/RequirementGraphPage.tsx';
import { RequirementReviewPage } from './pages/RequirementReviewPage.tsx';
import { PromptStudioPage } from './pages/PromptStudioPage.tsx';
import { WorkspacePage } from './pages/WorkspacePage.tsx';
import { EditorPage } from './pages/EditorPage.tsx';
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage.tsx';
import { ProjectSetupWizard, type ProjectSetupChoice } from './components/projects/ProjectSetupWizard.tsx';
import { saveProjectSetup, seedProjectFromTemplate } from './services/projectSeed.ts';
import { AssistantPanel } from './components/ai/AssistantPanel.tsx';
import { PricingDialog } from './components/pricing/PricingDialog.tsx';
import { PlanHubDialog, type PlanHubTab } from './components/pricing/PlanHubDialog.tsx';
import { getAdvisorContext, setAdvisorContext } from './services/aiAdvisor.ts';
import type { TemplateDefinition } from './data/templates.ts';
import { canCreateProject, readEntitlements, type PlanCode } from './services/entitlements.ts';
import { notificationService } from './services/notifications.ts';

const PUBLIC_TABS: ActiveTab[] = ['about', 'privacy', 'pricing', 'learn', 'manual', 'terms', 'contact'];

/** Pages that always carry the commercial header and footer. */
const MARKETING_TABS: ActiveTab[] = ['about', 'privacy', 'pricing', 'terms', 'contact'];

const KNOWN_TABS: ActiveTab[] = [
  'about',
  'overview',
  'dashboard',
  'projects',
  'project',
  'requirements',
  'intelligence',
  'review',
  'prompt',
  'workspace',
  'templates',
  'library',
  'learn',
  'pricing',
  'design',
  'new-analysis',
  'editor',
  'history',
  'manual',
  'settings',
  'privacy',
  'terms',
  'contact',
];

function isKnownTab(value: string | null): value is ActiveTab {
  return !!value && (KNOWN_TABS as string[]).includes(value);
}

function tabSessionKey(userId: string | undefined): string {
  return `vector_active_tab_session_${userId || 'guest'}`;
}

const ACTIVE_PROJECT_KEY = 'vector_active_project_v1';
const EDITOR_PROJECT_KEY = 'vector_editor_project_v1';
const EDITOR_ORIGIN_KEY = 'vector_editor_origin_v1';
const EDITOR_TEMPLATE_KEY = 'vector_editor_template_v1';
const EDITOR_SEED_KEY = 'vector_editor_seed_v1';

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    // storage is best effort
  }
}

function AppShell() {
  const { configured, loading, user, passwordRecovery } = useAuth();
  const { projects, currentProject, selectProject, createProject, loading: projectLoading } = useProject();
  const openPricing = useCallback(() => setPricingOpen(true), []);
  const navigate = useCallback((tab: ActiveTab) => {
    if (tab === 'pricing') {
      setPricingOpen(true);
      return;
    }
    setActiveTab(tab);
  }, []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('about');
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingIntent, setPricingIntent] = useState<{ plan: PlanCode; billing: 'monthly' | 'annual'; auto: boolean } | null>(null);
  const [planHubTab, setPlanHubTab] = useState<PlanHubTab | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [tabHydrated, setTabHydrated] = useState(false);
  const [, setEntitlementTick] = useState(0);

  // Re-render the shell when the plan changes, including after the billing
  // reconcile that runs on sign-in.
  useEffect(() => {
    const sync = () => setEntitlementTick((value) => value + 1);
    window.addEventListener('vector:entitlements', sync);
    return () => window.removeEventListener('vector:entitlements', sync);
  }, []);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [analysisToInspect, setAnalysisToInspect] = useState<AnalysisResult | null>(null);
  const [analysisPromptSeed, setAnalysisPromptSeed] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const projectScrollRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onOpenPricing = () => setPricingOpen(true);
    const onOpenHub = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setPlanHubTab(detail === 'usage' ? 'usage' : 'included');
    };
    window.addEventListener('vector:open-pricing', onOpenPricing);
    window.addEventListener('vector:open-plan-hub', onOpenHub);
    return () => {
      window.removeEventListener('vector:open-pricing', onOpenPricing);
      window.removeEventListener('vector:open-plan-hub', onOpenHub);
    };
  }, []);

  const [editorTemplate, setEditorTemplate] = useState<TemplateDefinition | null>(
    () => readStored(EDITOR_TEMPLATE_KEY)
  );
  const [editorSeed, setEditorSeed] = useState<{ name: string; pages: any[] } | null>(
    () => readStored(EDITOR_SEED_KEY)
  );
  const [editorOrigin, setEditorOrigin] = useState<ActiveTab>(
    () => readStored<ActiveTab>(EDITOR_ORIGIN_KEY) || 'templates'
  );
  const [editorProject, setEditorProject] = useState<{ id: string; name: string; type?: string } | null>(
    () => readStored(EDITOR_PROJECT_KEY)
  );
  const [editorFresh, setEditorFresh] = useState(false);
  const [activeProject, setActiveProject] = useState<{ id: string; name: string; description?: string } | null>(
    () => readStored(ACTIVE_PROJECT_KEY)
  );
  const [projectView, setProjectView] = useState<'hub' | 'prompt'>('hub');
  const [projectDocVersion, setProjectDocVersion] = useState(0);
  const [setupProject, setSetupProject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    writeStored(ACTIVE_PROJECT_KEY, activeProject);
  }, [activeProject]);
  useEffect(() => {
    writeStored(EDITOR_PROJECT_KEY, editorProject);
  }, [editorProject]);
  useEffect(() => {
    writeStored(EDITOR_ORIGIN_KEY, editorOrigin);
  }, [editorOrigin]);
  useEffect(() => {
    writeStored(EDITOR_TEMPLATE_KEY, editorTemplate);
  }, [editorTemplate]);
  useEffect(() => {
    writeStored(EDITOR_SEED_KEY, editorSeed);
  }, [editorSeed]);

  // A restored editor implies its project even if the active-project key was
  // cleared by a previous session.
  useEffect(() => {
    if (activeProject || !editorProject) return;
    setActiveProject({ id: editorProject.id, name: editorProject.name });
  }, [activeProject, editorProject]);

  // Reloading the prompt tab restores the project selected by ProjectContext.
  useEffect(() => {
    if (activeTab !== 'project' || activeProject || !currentProject) return;
    setActiveProject({
      id: currentProject.id,
      name: currentProject.name,
      description: currentProject.description,
    });
  }, [activeTab, activeProject, currentProject]);

  // A project created before its setup interview must still ask after a reload.
  useEffect(() => {
    if (activeTab !== 'project' || !activeProject || setupProject) return;
    try {
      if (localStorage.getItem(`vector_project_setup_pending_${activeProject.id}`) === '1') {
        setSetupProject({ id: activeProject.id, name: activeProject.name });
      }
    } catch {
      // ignore storage errors
    }
  }, [activeTab, activeProject, setupProject]);

  // If the tab survived a reload but the project was deleted, do not leave the
  // user on a blank page.
  useEffect(() => {
    if (activeTab !== 'project' || activeProject) return;
    if (projectLoading) return;
    if (!currentProject) setActiveTab('projects');
  }, [activeTab, activeProject, currentProject, projectLoading]);

  // Project-origin editor with a missing stored id: recover the context project.
  useEffect(() => {
    if (activeTab !== 'editor' || editorProject || !currentProject) return;
    if (editorOrigin !== 'project') return;
    setEditorProject({ id: currentProject.id, name: currentProject.name });
  }, [activeTab, editorProject, currentProject, editorOrigin]);

  const openProjectWorkspace = (id: string, name: string, description?: string) => {
    selectProject(id);
    setActiveProject({ id, name, description });
    setProjectView('hub');
    try {
      if (localStorage.getItem(`vector_project_setup_pending_${id}`) === '1') {
        setSetupProject({ id, name });
      }
    } catch {
      // ignore storage errors
    }
    setActiveTab('project');
  };

  // Project links use ?project=<id>. Resolve them once projects load. A live
  // share link is handled by the editor deep link above instead.
  useEffect(() => {
    if (projectLoading || !projects.length) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') === '1' && params.get('room')) return;
    const projectId = params.get('project');
    if (!projectId) return;
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    openProjectWorkspace(project.id, project.name, project.description);
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    window.history.replaceState({}, '', url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectLoading]);

  const dismissProjectSetup = () => {
    const id = setupProject?.id;
    if (id) {
      try {
        localStorage.removeItem(`vector_project_setup_pending_${id}`);
      } catch {
        // ignore
      }
    }
    setSetupProject(null);
  };

  const completeProjectSetup = (choice: ProjectSetupChoice) => {
    if (!setupProject) return;
    saveProjectSetup(setupProject.id, {
      purposes: choice.purposes,
      features: choice.features,
      start: choice.start,
      templateId: choice.template?.id ?? null,
      completedAt: new Date().toISOString(),
    });
    if (choice.template) {
      seedProjectFromTemplate(setupProject.id, setupProject.name, choice.template);
    }
    setProjectDocVersion((value) => value + 1);
    try {
      localStorage.removeItem(`vector_project_setup_pending_${setupProject.id}`);
    } catch {
      // ignore
    }
    setSetupProject(null);
    setProjectView('hub');
    setActiveTab('project');
  };

  const enterProjectCanvas = (options: { fresh: boolean; template?: TemplateDefinition | null }) => {
    if (!activeProject) return;
    setEditorProject({ id: activeProject.id, name: activeProject.name });
    setEditorOrigin('project');
    setEditorTemplate(options.template || null);
    setEditorSeed(null);
    setEditorFresh(options.fresh);
    setActiveTab('editor');
  };
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [wideViewport, setWideViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1440px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1440px)');
    const onChange = (event: MediaQueryListEvent) => setWideViewport(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // The assistant reserves horizontal space instead of covering the page.
  const assistantInset = assistantOpen && wideViewport ? 420 : 0;

  const publicMode = configured && !user;
  // Without Supabase the app runs as a local workspace, which is a valid
  // signed-in state — otherwise local users could never reach the dashboard.
  const localWorkspace = !configured;
  const signedIn = !!user || localWorkspace;
  // Marketing chrome is a property of the page, not of the session. Learn is
  // deliberately not in this list: it lives inside the workspace shell so the
  // rail and header never disappear when it is opened from the sidebar.
  const showMarketingChrome = MARKETING_TABS.includes(activeTab);

  // Restore the current tab for this browser session. A Pro share link wins
  // over the stored tab: it opens the shared canvas straight away.
  useEffect(() => {
    let next: ActiveTab = signedIn ? 'dashboard' : 'about';
    const params = new URLSearchParams(window.location.search);
    const shareProject = params.get('project');
    const isShareLink = params.get('share') === '1' && !!params.get('room') && !!shareProject;
    // A recipient who is not signed in goes straight to sign-in.
    if (isShareLink && !signedIn) setShowAuth(true);
    const shareLink = signedIn && isShareLink;
    if (shareLink && shareProject) {
      setEditorProject({
        id: shareProject,
        name: params.get('name') || 'Shared project',
      });
      setEditorOrigin('project');
      next = 'editor';
    } else {
      try {
        const saved = sessionStorage.getItem(tabSessionKey(user?.id));
        if (isKnownTab(saved)) next = saved;
      } catch {
        // ignore storage failures
      }
    }
    if (!signedIn && !PUBLIC_TABS.includes(next)) next = 'about';
    setActiveTab(next);
    setTabHydrated(true);
  }, [user?.id, signedIn, openPricing]);

  // Persist the active tab for refreshes during this page session.
  useEffect(() => {
    if (!tabHydrated) return;
    if (!signedIn && !PUBLIC_TABS.includes(activeTab)) return;
    try {
      sessionStorage.setItem(tabSessionKey(user?.id), activeTab);
    } catch {
      // ignore storage failures
    }
  }, [activeTab, user?.id, tabHydrated, signedIn]);

  // Each page starts at the top. Without this, switching tabs could leave the
  // user halfway down the previous page and make the new page look "stuck".
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  // Guests cannot open authenticated areas. Send them to sign-in instead of
  // silently dropping them back on the home page.
  useEffect(() => {
    if (!signedIn && !PUBLIC_TABS.includes(activeTab)) {
      setShowAuth(true);
      setActiveTab('about');
    }
    if (signedIn && activeTab === 'overview') setActiveTab('dashboard');
  }, [signedIn, activeTab]);

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      try {
        sessionStorage.removeItem('vector_signed_out_v1');
      } catch {
        // ignore
      }
    }
  }, [user]);

  // One welcome + plan overview per account, shown once after the first sign-in.
  useEffect(() => {
    if (!user) return;
    const key = `vector_welcome_v1_${user.id}`;
    try {
      if (localStorage.getItem(key) === 'done') return;
    } catch {
      // ignore
    }
    setWelcomeOpen(true);
  }, [user]);

  // A brand-new account gets a hands-on walkthrough: create a project, meet
  // every tool, try canvas and prompt mode, then open Base44.
  const guideStorageKey = user ? `vector_guide_v1_${user.id}` : '';

  const finishGuide = () => {
    try {
      if (guideStorageKey) localStorage.setItem(guideStorageKey, 'done');
    } catch {
      // ignore
    }
    setGuideOpen(false);
    setGuideStep(0);
  };

  useEffect(() => {
    if (!user || !signedIn || projectLoading) return;
    if (guideOpen || welcomeOpen || showAuth) return;
    if (projects.length > 0) return;
    if (activeTab !== 'dashboard' && activeTab !== 'projects') return;
    if (!guideStorageKey) return;
    try {
      if (localStorage.getItem(guideStorageKey) === 'done') return;
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      setGuideStep(0);
      setGuideOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [user, signedIn, projectLoading, guideOpen, welcomeOpen, showAuth, projects.length, activeTab, guideStorageKey]);

  // Lets Learn (or a support link) replay the walkthrough without touching the
  // completion flag for other accounts.
  useEffect(() => {
    const start = () => {
      setGuideStep(0);
      setGuideOpen(true);
    };
    window.addEventListener('vector:start-guide', start);
    return () => window.removeEventListener('vector:start-guide', start);
  }, []);

  // Entering a project (or coming back from the canvas / prompt mode) always
  // starts at the top of the workspace. Base44 is far down the page and was
  // pulling the viewport down when its frame loaded.
  useEffect(() => {
    if (activeTab !== 'project') return;
    const frame = window.requestAnimationFrame(() => {
      if (projectScrollRef.current) projectScrollRef.current.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, projectView, activeProject?.id]);

  const guidePage: GuidePage =
    activeTab === 'editor'
      ? 'editor'
      : activeTab === 'project'
        ? projectView === 'prompt'
          ? 'prompt'
          : 'project'
        : activeTab === 'projects'
          ? 'projects'
          : activeTab === 'dashboard'
            ? 'dashboard'
            : 'other';

  const guideNavigate = (target: GuidePage) => {
    if (target === 'other') return;
    if (target === 'dashboard') {
      setActiveTab('dashboard');
      return;
    }
    if (target === 'projects') {
      setActiveTab('projects');
      return;
    }
    if (!activeProject) {
      setActiveTab('projects');
      return;
    }
    if (target === 'project') {
      setProjectView('hub');
      setActiveTab('project');
      return;
    }
    if (target === 'editor') {
      enterProjectCanvas({ fresh: false });
      return;
    }
    setProjectView('prompt');
    setActiveTab('project');
  };

  // Keep the assistant's context honest: only the editor and the analysis page
  // carry a live prompt, every other tab gets a description of what is actually
  // on that screen. Replacing the context (rather than merging) is important so
  // page and element details from a previous canvas do not leak into the home
  // dashboard or the project workspace.
  useEffect(() => {
    if (activeTab === 'editor' || activeTab === 'new-analysis') return;

    const projectLabel = currentProject?.name ? `“${currentProject.name}”` : 'the current project';
    const recent = projects.slice(0, 4).map((project) => project.name).join(', ');
    const count = projects.length;
    const homeSummary = count
      ? `The home dashboard. Hero: “What will you build today?”, a search field, plan status, a Continue row with ${count} project${count === 1 ? '' : 's'}${recent ? ` (${recent})` : ''}, a template strip and a Learn card. No canvas editor is open.`
      : 'The home dashboard. Hero: “What will you build today?”, a search field, plan status, an empty Continue row with a New project card, a template strip and a Learn card. No canvas editor is open.';

    const screens: Record<string, { title: string; surface: string; summary: string }> = {
      dashboard: { title: 'Home', surface: 'Home dashboard', summary: homeSummary },
      projects: {
        title: 'Projects',
        surface: 'Projects list',
        summary: `The projects list. ${count ? `${count} saved project${count === 1 ? '' : 's'}${recent ? `, including ${recent}` : ''}.` : 'No projects saved yet.'} Each card opens a project workspace. No canvas editor is open.`,
      },
      templates: {
        title: 'Templates',
        surface: 'Templates gallery',
        summary: 'The template gallery with category filters and production-shaped template previews. Each preview opens a starter project. No canvas editor is open.',
      },
      learn: {
        title: 'Learn',
        surface: 'Learn hub',
        summary: 'The Learn hub with guided lessons and the 60-second product tour. No canvas editor is open.',
      },
      design: {
        title: 'Design systems',
        surface: 'Design systems',
        summary: 'The design-systems screen with saved brand tokens, colour palettes and typography. No canvas editor is open.',
      },
      library: {
        title: 'Library',
        surface: 'Library',
        summary: 'The saved library of prompts, elements and reusable assets. No canvas editor is open.',
      },
      history: {
        title: 'History',
        surface: 'History',
        summary: 'The analysis and prompt history for the workspace. No canvas editor is open.',
      },
      settings: {
        title: 'Settings',
        surface: 'Settings',
        summary: 'Account and workspace settings, including the AI model configuration. No canvas editor is open.',
      },
      project: {
        title: currentProject?.name || 'Project workspace',
        surface: 'Project workspace',
        summary: `The workspace for ${projectLabel}: the project folder, prompt versions, artifact pages, Base44 tools and sharing controls. The canvas editor is not open here; open the canvas to inspect elements.`,
      },
      workspace: {
        title: currentProject?.name || 'Prompt workspace',
        surface: 'Prompt workspace',
        summary: `The prompt workspace for ${projectLabel}: a split view of requirements, suggestions, acceptance criteria and the generated prompt or build preview. The canvas editor is not open here.`,
      },
      requirements: {
        title: currentProject?.name || 'Requirements',
        surface: 'Requirements',
        summary: `The requirements screen for ${projectLabel}. No canvas editor is open.`,
      },
      intelligence: {
        title: currentProject?.name || 'Requirement graph',
        surface: 'Requirement intelligence',
        summary: `The requirement graph for ${projectLabel}, showing links and dependencies between requirements. No canvas editor is open.`,
      },
      review: {
        title: currentProject?.name || 'Review',
        surface: 'Requirement review',
        summary: `The review screen for ${projectLabel}, showing edge cases, ambiguity and quality findings. No canvas editor is open.`,
      },
      prompt: {
        title: currentProject?.name || 'Prompt studio',
        surface: 'Prompt studio',
        summary: `The prompt studio for ${projectLabel}. No canvas editor is open.`,
      },
      pricing: {
        title: 'Pricing',
        surface: 'Pricing page',
        summary: 'The public pricing page with Free and Pro plans, monthly and annual prices. No canvas editor is open.',
      },
      manual: {
        title: 'Manual',
        surface: 'Manual',
        summary: 'The product manual and documentation. No canvas editor is open.',
      },
      about: { title: 'About', surface: 'About page', summary: 'The public About page. No canvas editor is open.' },
      privacy: { title: 'Privacy', surface: 'Privacy page', summary: 'The public privacy policy. No canvas editor is open.' },
      terms: { title: 'Terms', surface: 'Terms page', summary: 'The public terms page. No canvas editor is open.' },
      contact: { title: 'Contact', surface: 'Contact page', summary: 'The public contact page. No canvas editor is open.' },
    };

    const chosen = screens[activeTab] || {
      title: 'Vector',
      surface: 'App',
      summary: 'A Vector app screen. No canvas editor is open.',
    };

    setAdvisorContext({
      title: chosen.title,
      prompt: '',
      kind: 'general',
      surface: chosen.surface,
      summary: chosen.summary,
      appearance: 'Dark graphite interface with white type and a violet accent. No canvas editor is open.',
    });
  }, [activeTab, projects, currentProject?.name]);

  // Browser back/forward support: every tab change is a history entry, so the
  // back button (and the editor's back arrow) return where the user came from.
  useEffect(() => {
    if (window.history.state?.vectorTab === undefined) {
      window.history.replaceState({ vectorTab: activeTab }, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.history.state?.vectorTab === activeTab) return;
    window.history.pushState({ vectorTab: activeTab }, '');
  }, [activeTab]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const tab = (event.state as { vectorTab?: string } | null)?.vectorTab;
      if (tab && isKnownTab(tab)) setActiveTab(tab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Desktop shell (Electron) menu navigation.
  useEffect(() => {
    const bridge = (window as unknown as {
      vectorDesktop?: { onNavigate?: (callback: (tab: string) => void) => (() => void) | void };
    }).vectorDesktop;
    if (!bridge?.onNavigate) return;
    const off = bridge.onNavigate((tab) => {
      if (isKnownTab(tab)) setActiveTab(tab);
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, []);

  // The tour is opt-in from Learn or the profile menu. Auto-opening it on the
  // first visit covered the workspace before people knew what it was for.

  useEffect(() => {
    if (user && pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [user, pendingTab]);

  if (configured && loading) {
    return (
      <div className="min-h-screen bg-[#F6F4EC] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--v-accent)] font-semibold text-white">V</div>
          <p className="mt-3 text-xs font-medium text-[var(--v-muted)]">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (configured && passwordRecovery) {
    return <ResetPasswordPage />;
  }

  const knownPath =
    typeof window === 'undefined' ||
    window.location.pathname === '/' ||
    window.location.pathname === '/index.html';
  if (!knownPath) {
    return (
      <div className="flex min-h-screen flex-col v-bg text-[var(--v-ink)]">
        <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]"
          >
            <Logo size={24} /> Vector
          </button>
        </header>
        <main className="grid flex-1 place-items-center px-4 py-16">
          <div className="max-w-[460px] text-center">
            <p className="v-eyebrow">404</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">This page does not exist.</h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--v-muted)]">
              The link may be old, or the address may have a typo. Everything in Vector lives in your workspace.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => window.location.assign('/')} className="v-btn v-btn-primary h-9 px-4 text-[11.5px]">
                Back to home
              </button>
              <a href="mailto:hobbyhive52@gmail.com" className="v-btn v-btn-ghost h-9 px-4 text-[11.5px]">
                Contact us
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user && showAuth) {
    return <AuthPage initialMode={authMode} onBack={() => setShowAuth(false)} />;
  }

  const handleOpenAnalysis = (item: AnalysisResult) => {
    if (item.projectId && item.projectId !== currentProject?.id && projects.some((project) => project.id === item.projectId)) {
      selectProject(item.projectId);
    }
    setAnalysisToInspect(item);
    setAnalysisPromptSeed(null);
    setActiveTab('new-analysis');
  };

  const handleStartNewAnalysis = (prompt?: string) => {
    if (publicMode) {
      requestAuth('new-analysis');
      return;
    }
    // Click handlers pass the MouseEvent; only a real string is a prompt seed.
    const seed = typeof prompt === 'string' ? prompt.trim() : '';
    setAnalysisToInspect(null);
    setAnalysisPromptSeed(seed || null);
    setActiveTab('new-analysis');
  };

  const handleStartRequirementWorkflow = () => {
    handleStartNewAnalysis();
  };

  const requestAuth = (target?: ActiveTab) => {
    if (target) setPendingTab(target);
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRequestSignIn = () => {
    if (!configured) {
      setActiveTab('new-analysis');
      return;
    }
    requestAuth();
  };

  const handleUseTemplate = async (template: TemplateDefinition) => {
    if (publicMode) {
      requestAuth('templates');
      return;
    }

    const entitlements = readEntitlements();
    if (!canCreateProject(entitlements)) {
      notificationService.push({
        kind: 'trial',
        title: 'Your two free projects are used',
        body: 'Pick a plan to keep creating projects. Existing work stays accessible.',
        action: { label: 'See plans', tab: 'pricing' },
      });
      openPricing();
      return;
    }

    try {
      const project = await createProject(
        template.name,
        `${template.tagline} Template: ${template.id}`
      );
      try {
        localStorage.setItem(
          'vector_prompt_seed_v1',
          JSON.stringify({
            projectId: project.id,
            templateId: template.id,
            templateName: template.name,
            blocks: template.blocks,
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore storage failures
      }
      notificationService.push({
        kind: 'system',
        title: `“${template.name}” project created`,
        body: `${template.blocks.length} elements were pre-filled. Keep designing, the prompt updates as you go.`,
        action: { label: 'Open projects', tab: 'projects' },
      });
      // Templates always create a real project. Seed its document so the hub
      // and canvas open with the chosen starting blocks.
      seedProjectFromTemplate(project.id, project.name, template);
      setProjectDocVersion((value) => value + 1);
      saveProjectSetup(project.id, {
        purposes: [template.category.toLowerCase()],
        features: [],
        start: 'template',
        templateId: template.id,
        completedAt: new Date().toISOString(),
      });
      selectProject(project.id);
      setActiveProject({ id: project.id, name: project.name, description: project.description });
      setProjectView('hub');
      setActiveTab('project');
    } catch (error) {
      notificationService.push({
        kind: 'system',
        title: 'Could not create the project',
        body: error instanceof Error ? error.message : 'Unknown error. Try again.',
        action: { label: 'Open projects', tab: 'projects' },
      });
    }
  };

  const handleReplayTour = () => {
    resetTour();
    setTourOpen(true);
  };

  const closeWelcome = () => {
    setWelcomeOpen(false);
    if (!user) return;
    try {
      localStorage.setItem(`vector_welcome_v1_${user.id}`, 'done');
    } catch {
      // ignore
    }
  };

  const welcomeName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '';

  // The editor owns the whole viewport: no rail, no top bar, no page padding.
  if (activeTab === 'editor') {
    return (
      <main className="min-h-screen v-bg">
        <EditorPage
          template={editorTemplate}
          seed={editorSeed}
          projectId={editorProject?.id}
          projectName={editorProject?.name}
          projectTypeId={editorProject?.type}
          fresh={editorFresh}
          rightOffset={assistantInset}
          onExit={() => setActiveTab(editorOrigin)}
          onOpenAssistant={() => setAssistantOpen(true)}
          onRequireUpgrade={openPricing}
          onNavigate={navigate}
        />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          context={getAdvisorContext()}
          onRequireUpgrade={openPricing}
        />
        <PricingDialog
          open={pricingOpen}
          onClose={() => setPricingOpen(false)}
          onLearnMore={() => {
            setPricingOpen(false);
            setActiveTab('pricing');
          }}
        />
        <PlanHubDialog
          open={planHubTab !== null}
          initialTab={planHubTab ?? 'included'}
          onClose={() => setPlanHubTab(null)}
          onSeePlans={() => {
            setPlanHubTab(null);
            setPricingOpen(true);
          }}
        />
        <ProjectSetupWizard
          open={Boolean(setupProject)}
          project={setupProject ?? { id: '', name: '' }}
          onComplete={completeProjectSetup}
          onDismiss={dismissProjectSetup}
        />
        <GuidedTour
          open={guideOpen}
          page={guidePage}
          step={guideStep}
          setupOpen={Boolean(setupProject)}
          onStep={setGuideStep}
          onDone={finishGuide}
          onNavigate={guideNavigate}
        />
      </main>
    );
  }

  // The project studio owns the full viewport. The global rail and header are
  // temporarily hidden and return automatically when the user exits.
  if (activeTab === 'project' && activeProject) {
    return (
      <div className="flex h-screen flex-col overflow-hidden v-bg" data-app="true">
        <main ref={projectScrollRef} className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {projectView === 'prompt' ? (
            <PromptModePage
              key={`${activeProject.id}-${projectDocVersion}`}
              projectId={activeProject.id}
              projectName={activeProject.name}
              onBack={() => setProjectView('hub')}
              onOpenCanvas={() => enterProjectCanvas({ fresh: false })}
              onOpenAssistant={() => setAssistantOpen(true)}
              onRequireUpgrade={openPricing}
            />
          ) : (
            <ProjectWorkspacePage
              key={`${activeProject.id}-${projectDocVersion}`}
              project={{ id: activeProject.id, name: activeProject.name, description: activeProject.description }}
              onBack={() => setActiveTab('projects')}
              onOpenCanvas={() => enterProjectCanvas({ fresh: false })}
              onBlankCanvas={() => enterProjectCanvas({ fresh: true })}
              onOptimizePrompt={() => setProjectView('prompt')}
              onNavigate={setActiveTab}
            />
          )}
        </main>
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          context={getAdvisorContext()}
          onRequireUpgrade={openPricing}
        />
        <PricingDialog
          open={pricingOpen}
          onClose={() => setPricingOpen(false)}
          onLearnMore={() => {
            setPricingOpen(false);
            setActiveTab('pricing');
          }}
        />
        <PlanHubDialog
          open={planHubTab !== null}
          initialTab={planHubTab ?? 'included'}
          onClose={() => setPlanHubTab(null)}
          onSeePlans={() => {
            setPlanHubTab(null);
            setPricingOpen(true);
          }}
        />
        <ProjectSetupWizard
          open={Boolean(setupProject)}
          project={setupProject ?? { id: '', name: '' }}
          onComplete={completeProjectSetup}
          onDismiss={dismissProjectSetup}
        />
        <GuidedTour
          open={guideOpen}
          page={guidePage}
          step={guideStep}
          setupOpen={Boolean(setupProject)}
          onStep={setGuideStep}
          onDone={finishGuide}
          onNavigate={guideNavigate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen v-bg text-[var(--v-ink)] flex flex-col antialiased" data-app={showMarketingChrome ? 'false' : 'true'} style={{ paddingRight: assistantInset, transition: 'padding-right 200ms ease' }}>
      {!showMarketingChrome && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigate}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileNavOpen}
          setIsMobileOpen={setIsMobileNavOpen}
          publicMode={publicMode}
          onRequestSignIn={() => requestAuth()}
        />
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          showMarketingChrome ? '' : 'lg:pl-[232px]'
        }`}
      >
        {!showMarketingChrome && (
          <Header
            activeTab={activeTab}
            setActiveTab={navigate}
            onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            publicMode={publicMode}
            onRequestSignIn={() => requestAuth()}
            onReplayTour={handleReplayTour}
            onOpenAssistant={() => setAssistantOpen(true)}
            onSignedOut={() => {
              setActiveTab('about');
              try {
                sessionStorage.removeItem('vector_signed_out_v1');
              } catch {
                // ignore
              }
            }}
          />
        )}

        {showMarketingChrome && (
          <PublicHeader
            onRequestSignIn={handleRequestSignIn}
            onOpenApp={signedIn ? () => setActiveTab('dashboard') : undefined}
            onHome={() => setActiveTab('about')}
          />
        )}

        <main
          id="main-content"
          className={`mx-auto w-full flex-1 ${
            showMarketingChrome ? '' : 'max-w-[1480px] px-4 sm:px-6 lg:px-8 py-5 sm:py-7'
          }`}
          role="main"
        >
          {activeTab === 'about' && (
            <AboutPage
              onStartAnalysis={handleStartRequirementWorkflow}
              onOpenTemplates={() => setActiveTab('templates')}
              auth={
                configured && !user
                  ? {
                      configured,
                      onLogin: () => {
                        setAuthMode('login');
                        setShowAuth(true);
                      },
                      onRegister: () => {
                        setAuthMode('register');
                        setShowAuth(true);
                      },
                    }
                  : undefined
              }
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={navigate}
              onStartNewAnalysis={handleStartNewAnalysis}
              onStartTour={handleReplayTour}
              onOpenProject={(id, name) => openProjectWorkspace(id, name)}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesPage
              onUseTemplate={(template) => void handleUseTemplate(template)}
              onOpenTemplate={(template) => void handleUseTemplate(template)}
              onOpenPrivate={(seedName, pages) => {
                setEditorTemplate(null);
                setEditorProject(null);
                setEditorOrigin('templates');
                setEditorSeed({ name: seedName, pages });
                setEditorFresh(false);
                setActiveTab('editor');
              }}
              onNavigatePricing={openPricing}
            />
          )}

          {activeTab === 'library' && <LibraryPage />}

          {activeTab === 'learn' && (
            <LearnPage onNavigate={navigate} onStartTour={handleReplayTour} />
          )}

          {activeTab === 'pricing' && (
            <PricingPage intent={pricingIntent} onIntentConsumed={() => setPricingIntent(null)} onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
          )}

          {activeTab === 'overview' && (
            <OverviewPage
              publicMode={publicMode}
              onRequestSignIn={() => requestAuth()}
              onStartNewAnalysis={handleStartNewAnalysis}
              onOpenAnalysis={handleOpenAnalysis}
              onViewAllHistory={() => (publicMode ? requestAuth() : setActiveTab('history'))}
              onOpenProjects={() => (publicMode ? requestAuth() : setActiveTab('projects'))}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              onOpenProject={(project) => openProjectWorkspace(project.id, project.name, project.description)}
              onOpenPricing={openPricing}
              onOpenSettings={() => setActiveTab('settings')}
              onBrowseTemplates={() => setActiveTab('templates')}
              onCreated={(created) => {
                selectProject(created.id);
                setActiveProject({ id: created.id, name: created.name, description: created.description });
                setProjectView('hub');
                try {
                  localStorage.setItem(`vector_project_setup_pending_${created.id}`, '1');
                } catch {
                  // ignore
                }
                setSetupProject({ id: created.id, name: created.name });
                setActiveTab('project');
              }}
              onOpenEditor={() => {
                setEditorTemplate(null);
                setEditorProject(null);
                setEditorOrigin('templates');
                setEditorSeed(null);
                setEditorFresh(true);
                setActiveTab('editor');
              }}
            />
          )}          {activeTab === 'design' && (
            <DesignSystemsPage
              onOpenEditor={(seedName, seedPages) => {
                setEditorTemplate(null);
                setEditorProject(null);
                setEditorOrigin('templates');
                setEditorSeed({ name: seedName, pages: seedPages });
                setEditorFresh(false);
                setActiveTab('editor');
              }}
            />
          )}
          {activeTab === 'requirements' && <RequirementsPage />}
          {activeTab === 'intelligence' && <RequirementGraphPage />}
          {activeTab === 'review' && <RequirementReviewPage />}
          {activeTab === 'prompt' && <PromptStudioPage />}
          {activeTab === 'workspace' && <WorkspacePage />}

          {activeTab === 'new-analysis' && (
            <NewAnalysisPage
              initialResult={analysisToInspect}
              initialPrompt={analysisPromptSeed}
              onClearInitialResult={() => setAnalysisToInspect(null)}
              onViewHistory={() => setActiveTab('history')}
              onOpenProjects={() => setActiveTab('projects')}
            />
          )}

          {activeTab === 'manual' && <ManualPage onOpenProjects={() => setActiveTab('projects')} />}

          {activeTab === 'history' && (
            <HistoryPage
              onOpenAnalysis={handleOpenAnalysis}
              onStartNewAnalysis={handleStartNewAnalysis}
              onOpenProjects={() => setActiveTab('projects')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onOpenManual={() => setActiveTab('manual')}
              onOpenPrivacy={() => setActiveTab('privacy')}
            />
          )}
          {activeTab === 'privacy' && <PrivacyPage />}
          {activeTab === 'terms' && <TermsPage onNavigate={navigate} />}
          {activeTab === 'contact' && <ContactPage onNavigate={navigate} />}
        </main>

        {showMarketingChrome && (
          <PublicFooter
            activeTab={activeTab}
            onNavigate={navigate}
          />
        )}
      </div>

      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        context={getAdvisorContext()}
        onRequireUpgrade={openPricing}
      />
      <PricingDialog
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onLearnMore={() => {
          setPricingOpen(false);
          setActiveTab('pricing');
        }}
      />
      <PlanHubDialog
        open={planHubTab !== null}
        initialTab={planHubTab ?? 'included'}
        onClose={() => setPlanHubTab(null)}
        onSeePlans={() => {
          setPlanHubTab(null);
          setPricingOpen(true);
        }}
      />
      <ProjectSetupWizard
        open={Boolean(setupProject)}
        project={setupProject ?? { id: '', name: '' }}
        onComplete={completeProjectSetup}
        onDismiss={dismissProjectSetup}
      />
      <GuidedTour
        open={guideOpen}
        page={guidePage}
        step={guideStep}
        setupOpen={Boolean(setupProject)}
        onStep={setGuideStep}
        onDone={finishGuide}
        onNavigate={guideNavigate}
      />
      <WelcomeDialog
        open={welcomeOpen}
        name={welcomeName}
        onClose={closeWelcome}
        onOpenPlans={() => {
          closeWelcome();
          openPricing();
        }}
        onChoosePlan={(plan) => {
          closeWelcome();
          setPricingIntent({ plan, billing: 'monthly', auto: true });
          setActiveTab('pricing');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <AppShell />
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}





