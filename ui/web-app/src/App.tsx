import React, { useEffect, useState } from 'react';
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
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage.tsx';
import { TemplatePickerModal } from './components/projects/TemplatePickerModal.tsx';
import { starterPages } from './data/projectTypes.ts';
import { EditorPage } from './pages/EditorPage.tsx';
import { AssistantPanel } from './components/ai/AssistantPanel.tsx';
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

function AppShell() {
  const { configured, loading, user, passwordRecovery } = useAuth();
  const { projects, currentProject, selectProject, createProject } = useProject();
  const [activeTab, setActiveTab] = useState<ActiveTab>('about');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [tabHydrated, setTabHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [analysisToInspect, setAnalysisToInspect] = useState<AnalysisResult | null>(null);
  const [analysisPromptSeed, setAnalysisPromptSeed] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<TemplateDefinition | null>(null);
  const [editorSeed, setEditorSeed] = useState<{ name: string; pages: any[] } | null>(null);
  const [editorOrigin, setEditorOrigin] = useState<ActiveTab>('templates');
  const [editorProject, setEditorProject] = useState<{ id: string; name: string; type?: string } | null>(null);
  const [editorFresh, setEditorFresh] = useState(false);
  const [pendingProject, setPendingProject] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [activeProject, setActiveProject] = useState<{ id: string; name: string; description?: string } | null>(null);

  const openProjectWorkspace = (id: string, name: string, description?: string) => {
    setActiveProject({ id, name, description });
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
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
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
    // Local mode has no account wall, so the first visit starts on the public
    // product page instead of dropping straight into a busy workspace.
    let next: ActiveTab = signedIn && configured ? 'dashboard' : 'about';
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
      setActiveTab('pricing');
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
      setEditorTemplate(template);
      setEditorSeed(null);
      setActiveTab('editor');
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
          onRequireUpgrade={() => setActiveTab('pricing')}
          onNavigate={(tab) => setActiveTab(tab)}
        />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          context={getAdvisorContext()}
          onRequireUpgrade={() => setActiveTab('pricing')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen v-bg text-[var(--v-ink)] flex flex-col antialiased" style={{ paddingRight: assistantInset, transition: 'padding-right 200ms ease' }}>
      {!showMarketingChrome && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
            setActiveTab={setActiveTab}
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
            onNavigate={setActiveTab}
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
              onNavigate={setActiveTab}
              onStartNewAnalysis={handleStartNewAnalysis}
              onStartTour={handleReplayTour}
              onOpenProject={(id, name) => openProjectWorkspace(id, name)}
              onOpenAnalysis={handleOpenAnalysis}
            />
          )}

          {activeTab === 'templates' && (            <TemplatesPage
              onUseTemplate={(template) => void handleUseTemplate(template)}
              onOpenTemplate={(template) => {
                setEditorTemplate(template);
                setEditorSeed(null);
                setActiveTab('editor');
              }}
              onOpenPrivate={(seedName, pages) => {
                setEditorTemplate(null);
                setEditorSeed({ name: seedName, pages });
                setActiveTab('editor');
              }}
              onNavigatePricing={() => setActiveTab('pricing')}
            />
          )}

          {activeTab === 'library' && <LibraryPage />}

          {activeTab === 'learn' && (
            <LearnPage onNavigate={setActiveTab} onStartTour={handleReplayTour} />
          )}

          {activeTab === 'pricing' && (
            <PricingPage onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsPage onNavigate={setActiveTab} />
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

          {activeTab === 'project' && activeProject && (
            <ProjectWorkspacePage
              project={activeProject}
              onBack={() => setActiveTab('projects')}
              onOpenCanvas={() => enterProjectCanvas({ fresh: false })}
              onBlankCanvas={() => enterProjectCanvas({ fresh: true })}
              onOptimizePrompt={() => setActiveTab('new-analysis')}
              onOpenDesignSystem={() => setActiveTab('design')}
              onGenerate={() => enterProjectCanvas({ fresh: false })}
              onDeploy={() => setActiveTab('integrations')}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              onOpenProject={(project) => openProjectWorkspace(project.id, project.name, project.description)}
              onOpenSettings={() => setActiveTab('settings')}
              onBrowseTemplates={() => setActiveTab('templates')}
              onOpenIntegrations={() => setActiveTab('integrations')}
              onCreated={(created) => setPendingProject({ id: created.id, name: created.name, description: created.description })}
              onOpenEditor={() => {
                setEditorTemplate(null);
                setEditorProject(null);
                setActiveTab('editor');
              }}
            />
          )}          {activeTab === 'design' && (
            <DesignSystemsPage
              onOpenEditor={(seedName, seedPages) => {
                setEditorTemplate(null);
                setEditorSeed({ name: seedName, pages: seedPages });
                setActiveTab('editor');
              }}
            />
          )}
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
          {activeTab === 'terms' && <TermsPage onNavigate={setActiveTab} />}
          {activeTab === 'contact' && <ContactPage onNavigate={setActiveTab} />}
        </main>

        {showMarketingChrome && (
          <PublicFooter
            activeTab={activeTab}
            onNavigate={setActiveTab}
          />
        )}
      </div>

      <TemplatePickerModal
        open={!!pendingProject}
        projectName={pendingProject?.name || ''}
        onPick={(typeId) => {
          if (!pendingProject) return;
          setEditorProject({ id: pendingProject.id, name: pendingProject.name, type: typeId });
          setEditorOrigin('project');
          setEditorTemplate(null);
          setEditorSeed({ name: pendingProject.name, pages: starterPages(typeId) });
          setEditorFresh(true);
          setPendingProject(null);
          setActiveTab('editor');
        }}
        onSkip={() => {
          if (!pendingProject) return;
          setActiveProject(pendingProject);
          setPendingProject(null);
          setActiveTab('project');
        }}
        onClose={() => {
          if (!pendingProject) return;
          setActiveProject(pendingProject);
          setPendingProject(null);
          setActiveTab('project');
        }}
      />
      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        context={getAdvisorContext()}
        onRequireUpgrade={() => setActiveTab('pricing')}
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
