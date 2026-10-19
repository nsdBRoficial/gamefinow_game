import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';
import { supabase } from './supabaseClient';
import * as stellarServices from './stellarServices';

// Mock do supabaseClient e stellarServices
vi.mock('./supabaseClient', () => {
  return {
    MULTIPLAYER_ENABLED: true,
    supabase: {
      auth: {
        signInWithOAuth: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('Fase 1: Suíte de Autenticação Google e Recuperação Web3 (Persona P12 & P16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-01: Deve iniciar fluxo de OAuth do Google via Supabase com opções adequadas', async () => {
    (supabase!.auth.signInWithOAuth as any).mockResolvedValue({ error: null });

    const result = await authService.signInWithGoogle();
    expect(result.error).toBeNull();
    expect(supabase!.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }),
    });
  });

  it('AUTH-02: Recuperação de Jogador Existente com Google UID deve restaurar dados sem criar nova chave', async () => {
    const mockUser = {
      id: 'google-uid-12345',
      email: 'gabriel.google@stellar.org',
      user_metadata: { full_name: 'Gabriel Explorador' },
    };

    const mockExistingPlayer = {
      id: 'GEXISTINGSTELLARKEY1234567890ABCDEF',
      stellar_address: 'GEXISTINGSTELLARKEY1234567890ABCDEF',
      name: 'Gabriel Explorador',
      google_uid: 'google-uid-12345',
      email: 'gabriel.google@stellar.org',
      level: 7,
      xp_current: 2400,
    };

    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockOr = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockExistingPlayer, error: null });

    (supabase!.from as any).mockReturnValue({
      select: mockSelect,
      or: mockOr,
      maybeSingle: mockMaybeSingle,
    });

    const result = await authService.handleGoogleAuthSession();

    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(false);
    expect(result.profile?.name).toBe('Gabriel Explorador');
    expect(result.profile?.stellar_address).toBe('GEXISTINGSTELLARKEY1234567890ABCDEF');
    expect(result.profile?.level).toBe(7);
  });

  it('AUTH-03: Primeiro acesso Google provisiona chave Stellar on-chain e persiste na tabela players', async () => {
    const mockUser = {
      id: 'google-uid-novo-hero',
      email: 'novo.heroi@stellar.org',
      user_metadata: { full_name: 'Heroi Solar' },
    };

    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock busca banco: não existe jogador prévio
    const mockSelect = vi.fn().mockReturnThis();
    const mockOr = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    // Mock de inserção no banco
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertSelect = vi.fn().mockReturnThis();
    const mockInsertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'GNOVAPUBLICKEYSTELLAR77777777777777',
        stellar_address: 'GNOVAPUBLICKEYSTELLAR77777777777777',
        name: 'Heroi Solar',
        google_uid: 'google-uid-novo-hero',
        email: 'novo.heroi@stellar.org',
      },
      error: null,
    });

    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'players') {
        return {
          select: (fields?: string) => ({
            or: () => ({
              maybeSingle: mockMaybeSingle,
            }),
            single: mockInsertSingle,
          }),
          insert: (payload: any) => ({
            select: () => ({
              single: mockInsertSingle,
            }),
          }),
        };
      }
      return {};
    });

    // Mock do onboardUser para criar chave e trustlines
    const onboardSpy = vi.spyOn(stellarServices, 'onboardUser').mockResolvedValue({
      publicKey: 'GNOVAPUBLICKEYSTELLAR77777777777777',
      secretKey: 'SNOVASECRETKEYSTELLAR88888888888888',
    });

    const result = await authService.handleGoogleAuthSession();

    expect(onboardSpy).toHaveBeenCalledWith('novo.heroi@stellar.org', 'Heroi Solar', expect.any(Function));
    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(true);
    expect(result.profile?.stellar_address).toBe('GNOVAPUBLICKEYSTELLAR77777777777777');
    expect(result.secretKey).toBe('SNOVASECRETKEYSTELLAR88888888888888');
  });

  it('AUTH-04: Jogador Convidado/Existente vincula carteira Stellar atual à conta Google (linkCurrentWalletToGoogle)', async () => {
    const mockUser = {
      id: 'google-uid-link-999',
      email: 'jogador.linkado@stellar.org',
    };

    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockUpsertSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'GCARTEIRAATUAL1111111111111111111111',
        stellar_address: 'GCARTEIRAATUAL1111111111111111111111',
        name: 'Herói Antigo',
        google_uid: 'google-uid-link-999',
        email: 'jogador.linkado@stellar.org',
      },
      error: null,
    });

    (supabase!.from as any).mockReturnValue({
      upsert: () => ({
        select: () => ({
          single: mockUpsertSingle,
        }),
      }),
    });

    const result = await authService.linkCurrentWalletToGoogle(
      'GCARTEIRAATUAL1111111111111111111111',
      'Herói Antigo'
    );

    expect(result.success).toBe(true);
    expect(result.profile?.google_uid).toBe('google-uid-link-999');
    expect(result.profile?.email).toBe('jogador.linkado@stellar.org');
    expect(result.profile?.stellar_address).toBe('GCARTEIRAATUAL1111111111111111111111');
  });

  it('AUTH-08: Migração de Conta Legada - busca por email atrela o google_uid sem duplicar ou resetar conta', async () => {
    const mockUser = {
      id: 'google-uid-migracao-777',
      email: 'veterano@stellar.org',
      user_metadata: { full_name: 'Veterano Do Game' },
    };

    // Jogador antigo que tinha apenas e-mail salvo na migration v1/v2, sem google_uid
    const mockLegacyPlayer = {
      id: 'GVETERANOSTELLARADDRESS99999999999999',
      stellar_address: 'GVETERANOSTELLARADDRESS99999999999999',
      name: 'Veterano Do Game',
      google_uid: null,
      email: 'veterano@stellar.org',
      level: 10,
      xp_current: 5000,
    };

    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    (supabase!.from as any).mockReturnValue({
      select: () => ({
        or: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockLegacyPlayer, error: null }),
        }),
      }),
      update: mockUpdate,
    });

    const result = await authService.handleGoogleAuthSession();

    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(false);
    expect(result.profile?.level).toBe(10);
    expect(result.profile?.stellar_address).toBe('GVETERANOSTELLARADDRESS99999999999999');
    // Deve disparar update vinculando o novo google_uid ao ID existente
    expect(mockUpdate).toHaveBeenCalledWith({ google_uid: 'google-uid-migracao-777' });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'GVETERANOSTELLARADDRESS99999999999999');
  });

  it('AUTH-07: Cancelamento ou erro do provedor Google OAuth é tratado graciosamente', async () => {
    (supabase!.auth.signInWithOAuth as any).mockResolvedValue({
      error: new Error('User closed popup'),
    });

    const result = await authService.signInWithGoogle();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('User closed popup');
  });
});
