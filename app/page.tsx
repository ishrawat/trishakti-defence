'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Wrap in a timeout so the injected HTML is fully ready
    setTimeout(() => {
      
(function(){
  \'use strict\';

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById(\'menuToggle\');
  const nav = document.getElementById(\'nav\');
  menuToggle.addEventListener(\'click\', ()=>{
    nav.classList.toggle(\'mobile-open\');
    menuToggle.classList.toggle(\'open\');
  });
  nav.querySelectorAll(\'a\').forEach(a=>{
    a.addEventListener(\'click\', ()=>{
      nav.classList.remove(\'mobile-open\');
      menuToggle.classList.remove(\'open\');
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(\'.faq-item\').forEach(item=>{
    const q = item.querySelector(\'.faq-q\');
    const a = item.querySelector(\'.faq-a\');
    q.addEventListener(\'click\', ()=>{
      const isOpen = item.classList.contains(\'open\');
      document.querySelectorAll(\'.faq-item\').forEach(other=>{
        other.classList.remove(\'open\');
        other.querySelector(\'.faq-a\').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add(\'open\');
        a.style.maxHeight = a.scrollHeight + \'px\';
      }
    });
  });

  /* ---------- Fade-up on scroll ---------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add(\'in\');
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.12, rootMargin:\'0px 0px -40px 0px\'});
  document.querySelectorAll(\'.fade-up\').forEach(el=>io.observe(el));

  /* ---------- Enquiry form → WhatsApp ---------- */
  const form = document.getElementById(\'enqForm\');
  const WA_NUMBER = \'919999999999\'; // ← replace with real number

  form.addEventListener(\'submit\', e=>{
    e.preventDefault();
    const name  = document.getElementById(\'fname\').value.trim();
    const phone = document.getElementById(\'fphone\').value.trim();
    const age   = document.getElementById(\'fage\').value.trim();
    const trade = document.getElementById(\'ftrade\').value;

    if(!name || !phone || !age || !trade){
      alert(\'Please fill in all fields before sending.\');
      return;
    }

    const msg =
`*Trishul Defence  — Enquiry*

Name: ${name}
Phone: ${phone}
Age: ${age}
Interested course: ${trade}

Please share batch details, timings and fees.`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, \'_blank\');
  });

  /* ---------- Smooth anchor scroll ---------- */
  document.querySelectorAll(\'a[href^=\"#\"]\').forEach(a=>{
    a.addEventListener(\'click\', e=>{
      const id = a.getAttribute(\'href\');
      if(id === \'#\' || id.length < 2) return;
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({top, behavior:\'smooth\'});
    });
  });

})();

    }, 100);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: $css }} />
      <div dangerouslySetInnerHTML={{ __html: $body }} />
    </>
  );
}