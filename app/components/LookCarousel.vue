<template>
  <section class="w-full max-w-md lg:ml-auto" aria-roledescription="carousel">
    <div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div
        class="flex transition-transform duration-300 ease-out"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <figure
          v-for="slide in slides"
          :key="slide.src"
          class="relative min-w-full"
        >
          <img
            :src="slide.src"
            :alt="slide.alt"
            class="h-[420px] w-full object-cover object-top sm:h-[480px]"
          >
          <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-12 text-sm text-white">
            {{ slide.caption }}
          </figcaption>
        </figure>
      </div>

      <button
        type="button"
        class="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-md ring-1 ring-stone-200 transition hover:bg-white dark:bg-stone-900/90 dark:text-stone-50 dark:ring-stone-700"
        aria-label="Look précédent"
        @click="prev"
      >
        <ChevronLeftIcon class="size-5" />
      </button>
      <button
        type="button"
        class="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-md ring-1 ring-stone-200 transition hover:bg-white dark:bg-stone-900/90 dark:text-stone-50 dark:ring-stone-700"
        aria-label="Look suivant"
        @click="next"
      >
        <ChevronRightIcon class="size-5" />
      </button>
    </div>

    <div class="mt-3 flex justify-center gap-2" aria-hidden="true">
      <span
        v-for="(_, index) in slides"
        :key="index"
        class="h-1.5 w-6 rounded-full transition"
        :class="index === currentIndex ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-300 dark:bg-stone-600'"
      />
    </div>
  </section>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-icons/vue'

const slides = [
  { src: '/images/look-1.png', alt: 'Look chemise blanche et pantalon beige', caption: 'Look 1 — linen & beige' },
  { src: '/images/look-2.png', alt: 'Look manteau camel et pull noir', caption: 'Look 2 — camel coat' },
  { src: '/images/look-3.png', alt: 'Look pull marine et jupe crème', caption: 'Look 3 — navy knit' },
]

const currentIndex = ref(0)

function prev() {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % slides.length
}
</script>
