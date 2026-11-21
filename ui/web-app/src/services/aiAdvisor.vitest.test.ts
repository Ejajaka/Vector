import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  askAdvisor,
  getAdvisorContext,
  setAdvisorContext,
  suggestedQuestions,
} from './aiAdvisor.ts';
import { saveSettings } from './settings.ts';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  vi.stubGlobal('fetch', vi.fn());
});

describe('advisor context', () => {
  it('does not leak canvas fields when moving to a general screen', () => {
    setAdvisorContext({
      title: 'Checkout',
      prompt: 'a checkout page',
      kind: 'canvas',
      pageName: 'Page 1',
      pageCount: 2,
      background: '#FFFFFF',
      frame: { width: 1200, height: 800 },
      elements: [{ name: 'Button', label: 'Pay now' }],
    });
    expect(getAdvisorContext().pageName).toBe('Page 1');

    setAdvisorContext({
      title: 'Home',
      prompt: '',
      kind: 'general',
      surface: 'Home dashboard',
      summary: 'The home dashboard with a hero, recent projects and a template strip.',
    });

    const ctx = getAdvisorContext();
    expect(ctx.pageName).toBeUndefined();
    expect(ctx.elements).toBeUndefined();
    expect(ctx.background).toBeUndefined();
    expect(ctx.frame).toBeUndefined();
  });

  it('sends a general-screen description, not a blank canvas, to the model', async () => {
    saveSettings({
      apiKey: 'test-key',
      baseUrl: 'https://model.test/v1',
      model: 'test-model',
      autoDeepScan: true,
    });
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'Model reply' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const ctx = {
      title: 'Home',
      prompt: '',
      kind: 'general' as const,
      surface: 'Home dashboard',
      summary: 'The home dashboard with a hero, recent projects and a template strip.',
      appearance: 'Dark graphite interface with a violet accent.',
    };
    const result = await askAdvisor('what is on my screen?', ctx);
    expect(result.source).toBe('ai');
    expect(result.answer).toBe('Model reply');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const prompt = String(body.messages[1].content);
    expect(prompt).toContain('Surface: Home dashboard');
    expect(prompt).toContain('What is actually visible: The home dashboard');
    expect(prompt).toContain('not a canvas editor');
    expect(prompt).not.toContain('Page: Page 1');
    expect(prompt).not.toContain('Background: #FFFFFF');
    expect(prompt).not.toContain('Canvas elements:');
  });
});

describe('local reviewer', () => {
  it('answers a greeting without sounding broken', async () => {
    const ctx = {
      title: 'Home',
      prompt: '',
      kind: 'general' as const,
      surface: 'Home dashboard',
      summary: 'The home dashboard with a hero and recent projects.',
    };
    const result = await askAdvisor('hi', ctx);
    expect(result.source).toBe('local');
    expect(result.answer).toMatch(/^Hey\./);
    expect(result.answer).toContain('local mode');
    expect(result.answer).not.toContain("can't reach");
  });

  it('describes the home screen instead of claiming an empty canvas', async () => {
    const summary = 'The home dashboard with a hero, recent projects and a template strip.';
    const result = await askAdvisor('what is on my screen?', {
      title: 'Home',
      prompt: '',
      kind: 'general',
      surface: 'Home dashboard',
      summary,
    });
    expect(result.answer).toContain(summary);
    expect(result.answer).not.toMatch(/Page 1|empty canvas|#FFFFFF/);
  });

  it('offers home-specific prompts instead of canvas prompts', () => {
    expect(suggestedQuestions({
      title: 'Home',
      prompt: '',
      kind: 'general',
      surface: 'Home dashboard',
      summary: 'The home dashboard.',
    })).toContain('What can I do on this page?');
  });
});
