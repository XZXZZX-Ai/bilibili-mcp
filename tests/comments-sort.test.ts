import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ wbi: vi.fn(), plain: vi.fn(), comments: vi.fn() }));
vi.mock('../src/bilibili/http.js', () => ({ fetchWithWBI: mocks.wbi, fetchWithoutWBI: mocks.plain }));
vi.mock('../src/bilibili/video-api.js', () => ({ getVideoInfo: async () => ({ aid: 123, cid: 456 }) }));
vi.mock('../src/bilibili/fingerprint.js', () => ({ getBuvid: async () => null }));
vi.mock('../src/utils/credentials.js', () => ({ credentialManager: { getAuthHeaders: () => ({}) } }));
vi.mock('../src/bilibili/client.js', () => ({ getVideoComments: mocks.comments }));
import { getVideoComments } from '../src/bilibili/comments-api.js';
import { getVideoCommentsData } from '../src/bilibili/comments.js';
import { cacheManager } from '../src/utils/cache.js';
beforeEach(() => { vi.clearAllMocks(); cacheManager.clear(); });
it.each([0, 1])('maps sort %s consistently through success and both fallback routes', async (sort) => {
  const expected = sort === 0 ? 2 : 3;
  mocks.wbi.mockResolvedValueOnce({ replies: [{}] })
    .mockResolvedValueOnce({ replies: [] })
    .mockRejectedValueOnce(new Error('synthetic WBI failure'));
  mocks.plain.mockResolvedValue({ replies: [] });
  for (let i = 0; i < 3; i++) await getVideoComments('BV19h8Z6wEtf', 1, 20, sort, false);
  for (const call of mocks.wbi.mock.calls) expect(call[1].mode).toBe(String(expected));
  expect(mocks.plain).toHaveBeenCalledTimes(2);
  for (const call of mocks.plain.mock.calls) expect(call[1].mode).toBe(expected);
});
it('time requests mode 2 on WBI', async () => {
  mocks.wbi.mockResolvedValue({ replies: [{}] });
  await getVideoComments('BV19h8Z6wEtf', 1, 20, 0, false);
  expect(mocks.wbi.mock.calls[0][1].mode).toBe('2');
});
it('time requests mode 2 on plain fallback', async () => {
  mocks.wbi.mockResolvedValue({ replies: [] }); mocks.plain.mockResolvedValue({ replies: [] });
  await getVideoComments('BV19h8Z6wEtf', 1, 20, 0, false);
  expect(mocks.plain.mock.calls[0][1].mode).toBe(2);
});
it.each([false, true])('time preserves upstream root order despite popularity/timestamps=%s', async (timestamp) => {
  mocks.comments.mockResolvedValue({ replies: [
    { rpid: 1, ctime: 300, like: 1, member: { uname: 'newest' }, content: { message: 'newest' } },
    { rpid: 2, ctime: 200, like: 90, member: { uname: 'older' }, content: { message: timestamp ? '01:23 older' : 'older' } },
  ] });
  const result = await getVideoCommentsData('BV19h8Z6wEtf', { sort: 'time', detailLevel: 'brief', limit: 2, includeReplies: false });
  expect(result.comments.map(c => c.author)).toEqual(['newest', 'older']);
});

function comment(id: number, likes: number, text = 'plain', replies: unknown[] = []) {
  return { rpid: id, ctime: 1000 - id, like: likes, member: { uname: `user-${id}` }, content: { message: text }, replies };
}

it.each([
  ['brief', false, false], ['brief', true, false], ['detailed', false, false], ['detailed', true, false],
  ['brief', false, true], ['brief', true, true], ['detailed', false, true], ['detailed', true, true],
] as const)('preserves time order for %s replies=%s legacy=%s', async (detailLevel, includeReplies, legacy) => {
  mocks.comments.mockResolvedValue({ replies: [
    comment(1, 1, 'newest', [comment(11, 999, '01:23 reply'), comment(12, 0), comment(13, 0), comment(14, 0)]),
    comment(2, 100, '01:23 older', [comment(21, 999)]),
  ] });
  const result = legacy
    ? await getVideoCommentsData('BV19h8Z6wEtf', detailLevel, 0, includeReplies)
    : await getVideoCommentsData('BV19h8Z6wEtf', { detailLevel, sort: 'time', includeReplies, limit: 2 });
  const expected = ['user-1', 'user-2'];
  if (detailLevel === 'detailed' && includeReplies) expected.push('user-11', 'user-12', 'user-13', 'user-21');
  expect(result.comments.map(c => c.author)).toEqual(expected);
});

it('retains time order across pages, stable page size and caller limit', async () => {
  mocks.comments.mockImplementation(async (_bvid, page, pageSize) => ({
    replies: Array.from({ length: pageSize }, (_, i) => comment((page - 1) * 20 + i + 1, i * 10, i === 19 ? '01:23 older' : 'plain')),
  }));
  const result = await getVideoCommentsData('BV19h8Z6wEtf', { sort: 'time', limit: 25, includeReplies: false });
  expect(result.comments.map(c => c.author)).toEqual(Array.from({ length: 25 }, (_, i) => `user-${i + 1}`));
  expect(mocks.comments.mock.calls.map(c => [c[1], c[2]])).toEqual([[1, 20], [2, 20]]);
});

it('keeps hot timestamp/likes ordering and separates cached time results', async () => {
  mocks.comments.mockResolvedValue({ replies: [comment(1, 1), comment(2, 100), comment(3, 0, '01:23 timestamp')] });
  const time = await getVideoCommentsData('BV19h8Z6wEtf', { sort: 'time', includeReplies: false });
  const hot = await getVideoCommentsData('BV19h8Z6wEtf', { sort: 'hot', includeReplies: false });
  expect(time.comments.map(c => c.author)).toEqual(['user-1', 'user-2', 'user-3']);
  expect(hot.comments.map(c => c.author)).toEqual(['user-3', 'user-2', 'user-1']);
  expect(await getVideoCommentsData('BV19h8Z6wEtf', { sort: 'time', includeReplies: false })).toEqual(time);
  expect(mocks.comments).toHaveBeenCalledTimes(2);
});
