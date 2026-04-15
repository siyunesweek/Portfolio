---
title: 欢迎-WELCOME
date: 2026-04-13
excerpt: My first post
tags:
  - Life
layout: post.njk
---

Hallo! 

If you are reading this, I guess you already know my name (and not because my domain is already my name 😅). First of all, I welcome you to my webpage (Sid, I finally got one 🥳) I don't know how often I will write here, but knowing how lazy I am mmm, I think I won't be here too often XD.

Yes, I decided to start a blog. I guess there are phases you can't avoid, you just delay them. But at least I will be practising my English and Chinese.

In the future I will try to post about phones, Chinese culture, and some interesting projects or trips.

And since I've already run out of ideas for now, I'll leave it here but not before giving you a proper gift.
A <a href="#" id="cat-meme-link" style="text-decoration: underline; color: inherit;">cat meme compilation</a>
<div id="rickroll-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center;">
  <div style="position:relative; width:90%; max-width:800px;">
    <button id="rickroll-close" style="position:absolute; top:-40px; right:0; background:none; border:none; color:white; font-size:36px; cursor:pointer;" aria-label="Close">&times;</button>
    <div style="position:relative; padding-bottom:56.25%; height:0; background:#000;">
      <iframe id="rickroll-iframe" src="" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>
  </div>
</div>
<script>
  const link = document.getElementById('cat-meme-link');
  const modal = document.getElementById('rickroll-modal');
  const closeBtn = document.getElementById('rickroll-close');
  const iframe = document.getElementById('rickroll-iframe');
  const videoUrl = 'https://www.youtube.com/embed/xvFZjo5PgG0?autoplay=1';
  link.addEventListener('click', function(e) {
    e.preventDefault();
    modal.style.display = 'flex';
    iframe.src = videoUrl;
  });
  function closeModal() {
    modal.style.display = 'none';
    iframe.src = '';
  }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
</script>

