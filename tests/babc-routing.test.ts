import {describe,it,expect} from 'vitest';
import {unstable_doesMiddlewareMatch} from 'next/experimental/testing/server';
import {config} from '@/proxy';
describe('School portal routing',()=>{it('does not send BABC sessions through unrelated Supabase refresh middleware',()=>{for(const url of ['/','/portal/login','/portal/office','/portal/student','/portal/academics','/events'])expect(unstable_doesMiddlewareMatch({config,nextConfig:{},url})).toBe(false);});it('keeps refresh middleware on the original Supabase account routes',()=>{for(const url of ['/login','/access','/dashboard','/dashboard/settings'])expect(unstable_doesMiddlewareMatch({config,nextConfig:{},url})).toBe(true);});});
