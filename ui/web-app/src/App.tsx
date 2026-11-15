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
import { OverviewPage } from './pages/OverviewPage.tsx';
import { NewAnalysisPage } from './pages/NewAnalysisPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { PrivacyPage } from './pages/PrivacyPage.tsx';
import { ProjectsPage } from './pages/ProjectsPage.tsx';
import { RequirementsPage } from './pages/RequirementsPage.tsx';
import { RequirementGraphPage } from './pages/RequirementGraphPage.tsx';
import { RequirementReviewPage } from './pages/RequirementReviewPage.tsx';
import { PromptStudioPage } from './pages/PromptStudioPage.tsx';
import { DesignSystemsPage } from './pages/DesignSystemsPage.tsx';
import { WorkspacePage } from './pages/WorkspacePage.tsx';
import { ManualPage } from './pages/ManualPage.tsx';

const PUBLIC_TABS: ActiveTab[] = ['about', 'privacy'];

const KNOWN_TABS: ActiveTab[] = [
  'about',
  'overview',
  'projects',
  'requirements',
  'intelligence',
  'review',
  'prompt',
  'design',
  'workspace',
  'new-analysis',
  'history',
  'manual',
  'settings',
  'privacy',
];

function isKnownTab(value: string | null): value is ActiveTab {
  return !!value && (KNOWN_TABS as string[]).includes(value);
}

function tabSessionKey(userId: string | undefined): string {
  return `vector_active_tab_session_${userId || 'guest'}`;
}

function AppShell() {
  const { configured, loading, user, passwordRecovery } = useAuth();
  const { projects, currentProject, selectProject } = useProject();
  const [activeTab, setActiveTab] = useState<ActiveTab>('about');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [tabHydrated, setTabHydrated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [analysisToInspect, setAnalysisToInspect] = useState<AnalysisResult | null>(null);

  const publicMode = configured && !user;
  const showMarketingChrome = !user && (activeTab === 'about' || activeTab === 'privacy');

  // Restore the current tab for this browser session. Session storage survives
  // refreshes but clears when the page session is closed, so signed-in users
  // start a new visit at Projects.
  useEffect(() => {
    let next: ActiveTab = user ? 'projects' : 'about';
    try {
      const saved = sessionStorage.getItem(tabSessionKey(user?.id));
      if (isKnownTab(saved)) next = saved;
    } catch {
      // ignore storage failures
    }
    if (!user && !PUBLIC_TABS.includes(next)) next = 'about';
    if (user && (next === 'about' || next === 'overview')) next = 'projects';
    setActiveTab(next);
    setTabHydrated(true);
  }, [user?.id]);

  // Persist the active tab for refreshes during this page session.
  useEffect(() => {
    if (!tabHydrated) return;
    if (publicMode && !PUBLIC_TABS.includes(activeTab)) return;
    try {
      sessionStorage.setItem(tabSessionKey(user?.id), activeTab);
    } catch {
      // ignore storage failures
    }
  }, [activeTab, user?.id, tabHydrated, publicMode]);

  // Guests cannot open authenticated areas.
  useEffect(() => {
    if (publicMode && !PUBLIC_TABS.includes(activeTab)) setActiveTab('about');
    if (user && (activeTab === 'about' || activeTab === 'overview')) {
      // About and Overview are public onboarding pages only.
      setActiveTab('projects');
    }
  }, [publicMode, user, activeTab]);

  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

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
    setActiveTab('new-analysis');
  };

  const handleStartNewAnalysis = () => {
    if (publicMode) {
      requestAuth('new-analysis');
      return;
    }
    setAnalysisToInspect(null);
    setActiveTab('new-analysis');
  };

  const handleStartRequirementWorkflow = () => {
    if (publicMode) {
      requestAuth('requirements');
      return;
    }
    setActiveTab('requirements');
  };

  const requestAuth = (target?: ActiveTab) => {
    if (target) setPendingTab(target);
    setShowAuth(true);
  };

  const handleRequestSignIn = () => {
    if (!configured) {
      setActiveTab('overview');
      return;
    }
    requestAuth();
  };

  return (
    <div className="min-h-screen bg-[#F6F4EC] dark:bg-[#131A1B] text-[#283638] dark:text-[#E7E4D9] flex flex-col antialiased">
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
          showMarketingChrome ? '' : isSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        {!showMarketingChrome && (
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            publicMode={publicMode}
            onRequestSignIn={() => requestAuth()}
          />
        )}

        {showMarketingChrome && (
          <PublicHeader
            activeTab={activeTab}
            onNavigate={setActiveTab}
            onRequestSignIn={handleRequestSignIn}
          />
        )}

        <main id="main-content" className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto ${publicMode ? '' : ''}`} role="main">
          {activeTab === 'about' && <AboutPage onStartAnalysis={handleStartRequirementWorkflow} />}

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
              onOpenProject={handleStartNewAnalysis}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'requirements' && <RequirementsPage />}
          {activeTab === 'intelligence' && <RequirementGraphPage />}
          {activeTab === 'review' && <RequirementReviewPage />}
          {activeTab === 'prompt' && <PromptStudioPage />}
          {activeTab === 'design' && <DesignSystemsPage />}
          {activeTab === 'workspace' && <WorkspacePage />}

          {activeTab === 'new-analysis' && (
            <NewAnalysisPage
              initialResult={analysisToInspect}
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
        </main>

        {showMarketingChrome && (
          <PublicFooter
            activeTab={activeTab}
            onNavigate={setActiveTab}
          />
        )}
      </div>
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
