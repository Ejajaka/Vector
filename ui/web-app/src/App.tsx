import React, { useCallback, useEffect, useState } from 'react';
import type { ActiveTab, AnalysisResult } from './types/analysis.ts';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ProjectProvider, useProject } from './context/ProjectContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { PublicHeader } from './components/layout/PublicHeader.tsx';
import { PublicFooter } from './components/layout/PublicFooter.tsx';
import { AuthPage } from './components/auth/AuthPage.tsx';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage.tsx';
import { ProductTour, resetTour } from './components/onboarding/ProductTour.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { TemplatesPage } from './pages/TemplatesPage.tsx';
import { LearnPage } from './pages/LearnPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { IntegrationsPage } from './pages/IntegrationsPage.tsx';
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
import { canCreateProject, readEntitlements } from './services/entitlements.ts';
import { notificationService } from './services/notifications.ts';

const PUBLIC_TABS: ActiveTab[] = ['about', 'privacy', 'pricing', 'learn', 'terms', 'contact'];

/** Pages that always carry the commercial header and footer. */
const MARKETING_TABS: ActiveTab[] = ['about', 'privacy', 'pricing', 'learn', 'terms', 'contact'];

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
  'integrations',
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
  const [planHubTab, setPlanHubTab] = useState<PlanHubTab | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [tabHydrated, setTabHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [analysisToInspect, setAnalysisToInspect] = useState<AnalysisResult | null>(null);
  const [analysisPromptSeed, setAnalysisPromptSeed] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
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

  // Shared project links use ?project=<id>. Resolve them once projects load.
  useEffect(() => {
    if (projectLoading || !projects.length) return;
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (!projectId) return;
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    openProjectWorkspace(project.id, project.name, project.description);
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    window.history.replaceState({}, '', url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectLoading]);

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
  // Marketing chrome is a property of the page, not of the session: /pricing and
  // /about look like a commercial site whether or not you are signed in.
  const showMarketingChrome = MARKETING_TABS.includes(activeTab);

  // Restore the current tab for this browser session.
  useEffect(() => {
    let next: ActiveTab = signedIn ? 'dashboard' : 'about';
    try {
      const saved = sessionStorage.getItem(tabSessionKey(user?.id));
      if (isKnownTab(saved)) next = saved;
    } catch {
      // ignore storage failures
    }
    if (!signedIn && !PUBLIC_TABS.includes(next)) next = 'about';
    setActiveTab(next);
    setTabHydrated(true);
  }, [user?.id, signedIn]);

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

  // Guests cannot open authenticated areas.
  useEffect(() => {
    if (!signedIn && !PUBLIC_TABS.includes(activeTab)) setActiveTab('about');
    if (signedIn && activeTab === 'overview') setActiveTab('dashboard');
  }, [signedIn, activeTab]);

  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  // Keep the assistant's context honest: only the editor and the analysis page
  // carry a live prompt, every other tab gets a general workspace context.
  useEffect(() => {
    if (activeTab === 'editor' || activeTab === 'new-analysis') return;
    setAdvisorContext({ title: activeTab === 'templates' ? 'Templates' : activeTab === 'projects' ? 'Projects' : 'Workspace', prompt: '', kind: 'general' });
  }, [activeTab]);

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
          <div className="w-9 h-9 rounded-xl bg-[#2D5D4F] text-white mx-auto flex items-center justify-center font-black">V</div>
          <p className="mt-3 text-xs font-semibold text-[#737A72]">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (configured && passwordRecovery) {
    return <ResetPasswordPage />;
  }

  if (configured && !user && showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
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
    setAnalysisToInspect(null);
    setAnalysisPromptSeed(prompt?.trim() || null);
    setActiveTab('new-analysis');
  };

  const handleStartRequirementWorkflow = () => {
    handleStartNewAnalysis();
  };

  const requestAuth = (target?: ActiveTab) => {
    if (target) setPendingTab(target);
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

  // The editor owns the whole viewport: no rail, no top bar, no page padding.
  if (activeTab === 'editor') {
    return (
      <div className="min-h-screen v-bg">
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
        />
      </div>
    );
  }

  // The project studio owns the full viewport. The global rail and header are
  // temporarily hidden and return automatically when the user exits.
  if (activeTab === 'project' && activeProject) {
    return (
      <div className="flex h-screen flex-col overflow-hidden v-bg">
        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {projectView === 'prompt' ? (
            <PromptModePage
              key={activeProject.id}
              projectId={activeProject.id}
              projectName={activeProject.name}
              onBack={() => setProjectView('hub')}
              onOpenCanvas={() => enterProjectCanvas({ fresh: false })}
              onOpenAssistant={() => setAssistantOpen(true)}
              onRequireUpgrade={openPricing}
            />
          ) : (
            <ProjectWorkspacePage
              key={activeProject.id}
              project={{ id: activeProject.id, name: activeProject.name, description: activeProject.description }}
              onBack={() => setActiveTab('projects')}
              onOpenCanvas={() => enterProjectCanvas({ fresh: false })}
              onBlankCanvas={() => enterProjectCanvas({ fresh: true })}
              onOptimizePrompt={() => setProjectView('prompt')}
              onOpenDesignSystem={() => setActiveTab('design')}
            />
          )}
        </div>
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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen v-bg text-[var(--v-ink)] flex flex-col antialiased" style={{ paddingRight: assistantInset, transition: 'padding-right 200ms ease' }}>
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
          showMarketingChrome ? '' : 'lg:pl-[76px]'
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
          />
        )}

        {showMarketingChrome && (
          <PublicHeader
            activeTab={activeTab}
            onNavigate={navigate}
            onRequestSignIn={handleRequestSignIn}
            onOpenApp={signedIn ? () => setActiveTab('dashboard') : undefined}
          />
        )}

        <main
          id="main-content"
          className={`mx-auto w-full flex-1 ${
            showMarketingChrome ? '' : 'max-w-[1680px] px-4 sm:px-6 lg:px-8 py-5 sm:py-7'
          }`}
          role="main"
        >
          {activeTab === 'about' && <AboutPage onStartAnalysis={handleStartRequirementWorkflow} />}

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
            <PricingPage onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsPage onNavigate={navigate} />
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
              onOpenIntegrations={() => setActiveTab('integrations')}
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
            <SettingsPage onOpenManual={() => setActiveTab('manual')} />
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
