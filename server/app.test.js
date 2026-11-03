import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { createApp } from './app.js';
import { createDatabase } from './database.js';

test('admin can manage synchronized portfolio content and safely upload files', async (t) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-admin-'));
  const db = createDatabase(path.join(temporaryDirectory, 'portfolio.sqlite'));
  fs.writeFileSync(path.join(temporaryDirectory, 'index.html'), '<!doctype html><title>Portfolio</title>');
  const password = 'test-admin-password-2026';
  const env = {
    ADMIN_USERNAME: 'test-admin',
    ADMIN_PASSWORD_HASH: await bcrypt.hash(password, 10),
    SESSION_SECRET: 'test-session-secret-with-more-than-thirty-two-characters',
    NODE_ENV: 'production',
    TRUST_PROXY: '1'
  };
  const { app } = createApp({
    db,
    env,
    uploadsDirectory: path.join(temporaryDirectory, 'uploads'),
    staticDirectory: temporaryDirectory
  });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const get = (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('x-forwarded-proto', 'https');
    return fetch(`${baseUrl}${url}`, { ...options, headers });
  };
  let response = await get('/admin');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Portfolio/);

  response = await get('/api/content');
  assert.equal(response.status, 200);
  const initialContent = await response.json();
  assert.equal(initialContent.projects.length, 6);
  assert.equal(initialContent.experiences.length, 2);
  assert.equal(initialContent.certificates.length, 4);

  response = await get('/api/admin/content');
  assert.equal(response.status, 401);

  response = await get('/api/auth/session');
  let cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
  let session = await response.json();
  assert.ok(cookie);
  assert.ok(session.csrfToken);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /SameSite=Strict/i);
  assert.match(response.headers.get('set-cookie'), /Secure/i);

  response = await get('/api/auth/login', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({ username: env.ADMIN_USERNAME, password })
  });
  assert.equal(response.status, 200);
  cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
  session = await response.json();

  response = await get('/api/admin/content');
  assert.equal(response.status, 401);
  response = await get('/api/admin/content', { headers: { cookie } });
  assert.equal(response.status, 200);

  response = await get('/api/admin/content/projects', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({
      title: 'Test Project',
      category: 'Testing',
      description: 'Project used to verify admin content management.',
      tags: ['Node.js', 'SQLite'],
      links: [{ label: 'Repository', url: 'https://example.com/repo' }],
      imageUrl: ''
    })
  });
  assert.equal(response.status, 201);
  const project = await response.json();
  assert.ok(project.id);

  response = await get(`/api/admin/content/projects/${project.id}`, {
    method: 'PUT',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({
      ...project,
      category: 'Updated testing'
    })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).category, 'Updated testing');

  response = await get('/api/admin/content/projects', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({
      title: 'Invalid Project',
      category: 'Test',
      description: 'Invalid URL is rejected.',
      tags: [],
      links: [{ label: 'Bad link', url: 'javascript:alert(1)' }],
      imageUrl: ''
    })
  });
  assert.equal(response.status, 400);

  response = await get(`/api/admin/content/projects/${project.id}`, {
    method: 'DELETE',
    headers: { cookie, 'x-csrf-token': session.csrfToken }
  });
  assert.equal(response.status, 204);

  response = await get('/api/admin/content/experiences', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({
      title: 'Systems Consultant',
      company: 'Independent',
      period: '2026 — Present',
      bullets: ['Designed and operated reliable systems.']
    })
  });
  assert.equal(response.status, 201);
  const experience = await response.json();

  response = await get('/api/admin/content/certificates', {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken
    },
    body: JSON.stringify({
      title: 'New Linux Course',
      issuer: 'Training Provider',
      date: 'November 2026',
      credentialId: 'CERT-2026-01',
      fileUrl: '/uploads/123e4567-e89b-42d3-a456-426614174000.pdf',
      previewUrl: '',
      verificationUrl: 'https://example.com/verify',
      note: '',
      fileType: 'pdf'
    })
  });
  assert.equal(response.status, 201);

  response = await get('/api/content');
  const updatedContent = await response.json();
  assert.equal(updatedContent.projects.length, initialContent.projects.length);
  assert.equal(updatedContent.experiences.length, initialContent.experiences.length + 1);
  assert.equal(updatedContent.experiences[0].id, experience.id);
  assert.equal(updatedContent.certificates.length, initialContent.certificates.length + 1);

  const png = fs.readFileSync(path.resolve('public/certificates/linux-course-certificate-preview.png'));
  const uploadBody = new FormData();
  uploadBody.append('file', new Blob([png], { type: 'image/png' }), 'preview.png');
  response = await get('/api/admin/uploads', {
    method: 'POST',
    headers: { cookie, 'x-csrf-token': session.csrfToken },
    body: uploadBody
  });
  assert.equal(response.status, 201);
  const uploaded = await response.json();
  assert.match(uploaded.url, /^\/uploads\/[a-f0-9-]+\.png$/);

  const invalidUpload = new FormData();
  invalidUpload.append('file', new Blob(['not a PNG'], { type: 'image/png' }), 'fake.png');
  response = await get('/api/admin/uploads', {
    method: 'POST',
    headers: { cookie, 'x-csrf-token': session.csrfToken },
    body: invalidUpload
  });
  assert.equal(response.status, 400);

  response = await get(uploaded.url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');

  response = await get('/api/auth/logout', {
    method: 'POST',
    headers: { cookie, 'x-csrf-token': session.csrfToken }
  });
  assert.equal(response.status, 204);
  response = await get('/api/admin/content', { headers: { cookie } });
  assert.equal(response.status, 401);
});
