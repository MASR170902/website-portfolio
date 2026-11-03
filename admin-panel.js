const TYPES = {
  projects: 'Proyek',
  experiences: 'Pengalaman',
  certificates: 'Sertifikat'
};

const text = (tagName, className, value) => {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = value;
  return element;
};

export async function renderAdminPage() {
  document.title = 'Admin Portfolio | Muhammad Abdul Rasyid';
  document.body.className = 'min-h-screen bg-slatebg text-navy antialiased';
  document.body.replaceChildren();

  let csrfToken = '';
  let activeType = 'projects';
  let activeId = '';
  let content = { projects: [], experiences: [], certificates: [] };
  const shell = document.createElement('main');
  shell.className = 'mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8';
  document.body.append(shell);

  const request = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (csrfToken && options.method && options.method !== 'GET') {
      headers.set('x-csrf-token', csrfToken);
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin'
    });
    if (response.status === 204) return null;
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
    return body;
  };

  const status = text('p', 'mt-4 text-sm text-navySoft', '');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const pageHeader = () => {
    const header = document.createElement('header');
    header.className = 'mb-8 flex flex-wrap items-center justify-between gap-4';
    const titleGroup = document.createElement('div');
    titleGroup.append(
      text('p', 'text-xs font-bold uppercase tracking-[0.25em] text-blue', 'Portfolio dashboard'),
      text('h1', 'mt-2 text-3xl font-black tracking-tight text-navy', 'Kelola konten website')
    );
    const home = document.createElement('a');
    home.href = '/';
    home.className = 'rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-blue hover:text-blue';
    home.textContent = 'Kembali ke website';
    header.append(titleGroup, home);
    return header;
  };

  const renderLogin = () => {
    shell.replaceChildren(pageHeader());
    const panel = document.createElement('section');
    panel.className = 'mx-auto max-w-md rounded-2xl border border-border bg-white p-6 shadow-soft sm:p-8';
    panel.append(
      text('h2', 'text-xl font-bold text-navy', 'Login admin'),
      text('p', 'mt-2 text-sm leading-relaxed text-navySoft', 'Masuk untuk mengelola proyek, pengalaman, dan sertifikat portfolio.')
    );
    const form = document.createElement('form');
    form.className = 'mt-6 space-y-4';
    const username = document.createElement('input');
    username.name = 'username';
    username.required = true;
    username.autocomplete = 'username';
    username.maxLength = 100;
    username.className = 'mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue';
    const password = document.createElement('input');
    password.name = 'password';
    password.type = 'password';
    password.required = true;
    password.autocomplete = 'current-password';
    password.className = username.className;
    [
      ['Nama pengguna', username],
      ['Kata sandi', password]
    ].forEach(([label, input]) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'block text-sm font-semibold text-navy';
      wrapper.append(document.createTextNode(label), input);
      form.append(wrapper);
    });
    const error = text('p', 'hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700', '');
    error.setAttribute('role', 'alert');
    const submit = text('button', 'w-full rounded-xl bg-blue px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blueHover disabled:opacity-60', 'Masuk');
    submit.type = 'submit';
    form.append(error, submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.classList.add('hidden');
      submit.disabled = true;
      try {
        const result = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username: username.value,
            password: password.value
          })
        });
        csrfToken = result.csrfToken;
        await renderDashboard();
      } catch (requestError) {
        error.textContent = requestError.message;
        error.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        password.value = '';
      }
    });
    panel.append(form);
    shell.append(panel, status);
    username.focus();
  };

  const loadContent = async () => {
    content = await request('/api/admin/content');
  };

  const renderDashboard = async () => {
    try {
      await loadContent();
    } catch (error) {
      if (error.message.includes('log in')) {
        renderLogin();
        return;
      }
      throw error;
    }

    shell.replaceChildren(pageHeader());
    const toolbar = document.createElement('div');
    toolbar.className = 'mb-5 flex flex-wrap items-center justify-between gap-4';
    const tabs = document.createElement('div');
    tabs.className = 'flex flex-wrap gap-2';
    Object.entries(TYPES).forEach(([type, label]) => {
      const tab = text(
        'button',
        `rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${activeType === type ? 'border-blue bg-blue text-white' : 'border-border bg-white text-navySoft hover:border-blue hover:text-blue'}`,
        `${label} (${content[type].length})`
      );
      tab.type = 'button';
      tab.addEventListener('click', () => {
        activeType = type;
        activeId = '';
        renderDashboard();
      });
      tabs.append(tab);
    });
    const logout = text('button', 'rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-navySoft hover:border-red-300 hover:text-red-700', 'Keluar');
    logout.type = 'button';
    logout.addEventListener('click', async () => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
        const auth = await request('/api/auth/session');
        csrfToken = auth.csrfToken;
        renderLogin();
      } catch (error) {
        status.textContent = error.message;
      }
    });
    toolbar.append(tabs, logout);

    const workspace = document.createElement('div');
    workspace.className = 'grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]';
    const listPanel = document.createElement('section');
    listPanel.className = 'rounded-2xl border border-border bg-white p-5 shadow-soft';
    const listHeader = document.createElement('div');
    listHeader.className = 'flex items-center justify-between gap-3';
    listHeader.append(text('h2', 'text-lg font-bold text-navy', TYPES[activeType]));
    const add = text('button', 'rounded-lg bg-blue px-3 py-2 text-xs font-bold text-white hover:bg-blueHover', 'Tambah');
    add.type = 'button';
    add.addEventListener('click', () => {
      activeId = '';
      renderDashboard();
    });
    listHeader.append(add);
    const entries = document.createElement('div');
    entries.className = 'mt-4 space-y-2';
    content[activeType].forEach((entry) => {
      const row = document.createElement('div');
      row.className = `flex items-center justify-between gap-3 rounded-xl border p-3 ${activeId === entry.id ? 'border-blue bg-blue/5' : 'border-border'}`;
      const edit = text('button', 'min-w-0 flex-1 truncate text-left text-sm font-semibold text-navy hover:text-blue', entry.title);
      edit.type = 'button';
      edit.addEventListener('click', () => {
        activeId = entry.id;
        renderDashboard();
      });
      const remove = text('button', 'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50', 'Hapus');
      remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!window.confirm(`Hapus "${entry.title}"?`)) return;
        try {
          await request(`/api/admin/content/${activeType}/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
          activeId = '';
          status.textContent = 'Konten berhasil dihapus.';
          await renderDashboard();
        } catch (error) {
          status.textContent = error.message;
        }
      });
      row.append(edit, remove);
      entries.append(row);
    });
    if (!content[activeType].length) {
      entries.append(text('p', 'rounded-xl bg-slate-50 p-4 text-sm text-muted', 'Belum ada konten. Tekan Tambah untuk membuat yang pertama.'));
    }
    listPanel.append(listHeader, entries);

    const editorPanel = document.createElement('section');
    editorPanel.className = 'rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6';
    const selected = content[activeType].find((entry) => entry.id === activeId) || null;
    editorPanel.append(
      text('h2', 'text-lg font-bold text-navy', selected ? `Edit ${TYPES[activeType].toLowerCase()}` : `Tambah ${TYPES[activeType].toLowerCase()}`)
    );
    const form = document.createElement('form');
    form.className = 'mt-5 space-y-4';
    const addField = (labelText, name, value = '', options = {}) => {
      const label = document.createElement('label');
      label.className = 'block text-sm font-semibold text-navy';
      label.append(document.createTextNode(labelText));
      const input = options.multiline ? document.createElement('textarea') : document.createElement('input');
      if (!options.multiline && options.file) input.type = 'file';
      else if (!options.multiline) input.type = options.type || 'text';
      input.name = name;
      input.className = 'mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-normal text-navy outline-none focus:border-blue';
      if (options.multiline) input.rows = options.rows || 4;
      if (options.file) input.accept = options.accept;
      if (!options.multiline && !options.file) {
        input.maxLength = options.maxLength || 2000;
        input.value = value || '';
      } else if (options.multiline) {
        input.value = value || '';
      }
      if (options.required) input.required = true;
      if (options.help) {
        label.append(input, text('span', 'mt-1 block text-xs font-normal text-muted', options.help));
      } else {
        label.append(input);
      }
      form.append(label);
      return input;
    };

    if (activeType === 'projects') {
      addField('Nama proyek', 'title', selected?.title, { required: true });
      addField('Kategori', 'category', selected?.category, { required: true });
      addField('Deskripsi', 'description', selected?.description, { multiline: true, rows: 5, required: true });
      addField('Teknologi / tag (satu per baris)', 'tags', selected?.tags.join('\n'), { multiline: true, rows: 3 });
      addField('Tautan (satu per baris: Label | URL)', 'links', selected?.links.map((link) => `${link.label} | ${link.url}`).join('\n'), { multiline: true, rows: 3 });
      addField('Gambar sampul (opsional)', 'projectImage', '', {
        file: true,
        accept: 'image/png,image/jpeg,image/webp',
        help: 'PNG, JPEG, atau WebP. Kosongkan jika ingin menggunakan sampul kategori.'
      });
      addField('', 'imageUrl', selected?.imageUrl, { type: 'hidden' });
    } else if (activeType === 'experiences') {
      addField('Jabatan', 'title', selected?.title, { required: true });
      addField('Perusahaan / klien', 'company', selected?.company, { required: true });
      addField('Periode', 'period', selected?.period, { required: true, maxLength: 100 });
      addField('Uraian pengalaman (satu poin per baris)', 'bullets', selected?.bullets.join('\n'), { multiline: true, rows: 8 });
    } else {
      addField('Nama sertifikat / kursus', 'title', selected?.title, { required: true });
      addField('Penerbit', 'issuer', selected?.issuer, { required: true });
      addField('Tanggal terbit', 'date', selected?.date, { maxLength: 80 });
      addField('Nomor sertifikat', 'credentialId', selected?.credentialId, { maxLength: 160 });
      addField('Tautan verifikasi (opsional)', 'verificationUrl', selected?.verificationUrl, { maxLength: 2048 });
      addField('Catatan (opsional)', 'note', selected?.note, { multiline: true, rows: 2 });
      addField('File sertifikat (PDF, JPEG, PNG, WebP)', 'certificateFile', '', {
        file: true,
        accept: 'application/pdf,image/png,image/jpeg,image/webp',
        required: !selected,
        help: selected ? 'Pilih file hanya jika ingin mengganti file sertifikat saat ini.' : 'File maksimal 20 MB.'
      });
      addField('Gambar pratinjau (opsional)', 'certificatePreview', '', {
        file: true,
        accept: 'image/png,image/jpeg,image/webp',
        help: 'Gunakan gambar sertifikat agar kartu terlihat langsung; file PDF tetap menjadi tautan utama.'
      });
      addField('', 'fileUrl', selected?.fileUrl, { type: 'hidden' });
      addField('', 'previewUrl', selected?.previewUrl, { type: 'hidden' });
      addField('', 'fileType', selected?.fileType, { type: 'hidden' });
    }

    const formError = text('p', 'hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700', '');
    formError.setAttribute('role', 'alert');
    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap gap-3 pt-2';
    const save = text('button', 'rounded-xl bg-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blueHover disabled:opacity-60', 'Simpan');
    save.type = 'submit';
    actions.append(save);
    if (selected) {
      const cancel = text('button', 'rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-navySoft hover:border-blue hover:text-blue', 'Batal');
      cancel.type = 'button';
      cancel.addEventListener('click', () => {
        activeId = '';
        renderDashboard();
      });
      actions.append(cancel);
    }
    form.append(formError, actions);

    const valueOf = (name) => form.elements.namedItem(name)?.value.trim() || '';
    const uploadFile = async (file) => {
      if (!file) return null;
      const body = new FormData();
      body.append('file', file);
      return request('/api/admin/uploads', { method: 'POST', body });
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      formError.classList.add('hidden');
      save.disabled = true;
      try {
        let record;
        if (activeType === 'projects') {
          const image = await uploadFile(form.elements.namedItem('projectImage').files[0]);
          const links = valueOf('links').split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
            const separator = line.indexOf('|');
            if (separator < 1) throw new Error(`Tautan baris ${index + 1} harus berformat Label | URL.`);
            return { label: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
          });
          record = {
            title: valueOf('title'),
            category: valueOf('category'),
            description: valueOf('description'),
            tags: valueOf('tags').split('\n').map((tag) => tag.trim()).filter(Boolean),
            links,
            imageUrl: image?.url || valueOf('imageUrl')
          };
        } else if (activeType === 'experiences') {
          record = {
            title: valueOf('title'),
            company: valueOf('company'),
            period: valueOf('period'),
            bullets: valueOf('bullets').split('\n').map((bullet) => bullet.trim()).filter(Boolean)
          };
        } else {
          const certificateFile = await uploadFile(form.elements.namedItem('certificateFile').files[0]);
          const previewFile = await uploadFile(form.elements.namedItem('certificatePreview').files[0]);
          const fileUrl = certificateFile?.url || valueOf('fileUrl');
          const previewUrl = previewFile?.url || valueOf('previewUrl') ||
            (certificateFile?.mimeType.startsWith('image/') ? fileUrl : '');
          record = {
            title: valueOf('title'),
            issuer: valueOf('issuer'),
            date: valueOf('date'),
            credentialId: valueOf('credentialId'),
            verificationUrl: valueOf('verificationUrl'),
            note: valueOf('note'),
            fileUrl,
            previewUrl,
            fileType: certificateFile
              ? certificateFile.mimeType === 'application/pdf' ? 'pdf' : 'image'
              : valueOf('fileType') || 'pdf'
          };
        }

        const url = selected
          ? `/api/admin/content/${activeType}/${encodeURIComponent(selected.id)}`
          : `/api/admin/content/${activeType}`;
        await request(url, {
          method: selected ? 'PUT' : 'POST',
          body: JSON.stringify(record)
        });
        activeId = '';
        status.textContent = 'Perubahan berhasil disimpan.';
        await renderDashboard();
      } catch (error) {
        formError.textContent = error.message;
        formError.classList.remove('hidden');
      } finally {
        save.disabled = false;
      }
    });

    editorPanel.append(form);
    workspace.append(listPanel, editorPanel);
    shell.append(toolbar, workspace, status);
  };

  try {
    const auth = await request('/api/auth/session');
    csrfToken = auth.csrfToken;
    if (auth.authenticated) await renderDashboard();
    else renderLogin();
  } catch (error) {
    shell.replaceChildren(pageHeader());
    const alert = text('p', 'rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800', `Panel admin tidak dapat dimuat: ${error.message}`);
    alert.setAttribute('role', 'alert');
    shell.append(alert);
  }
}
