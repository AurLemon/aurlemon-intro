<template>
    <div class="aurle-project aurle-page">
        <ContentContainer page="project" title="项目" subtitle="无语，懒得和不懂 JS 的美的人说话。"/>
        <div class="aurle-project-item github-calendar" id="githubCalendar"></div>
    </div>
</template>

<script setup lang="ts">
import ContentContainer from '~/components/content/ContentContainer.vue'

import { ref, onMounted } from 'vue'
import GitHubCalendar from 'github-calendar'
import 'github-calendar/dist/github-calendar-responsive.css'
import 'github-calendar/dist/github-calendar.css'

onMounted(() => {
    GitHubCalendar('#githubCalendar', "AurLemon", { responsive: true })
})

useHead({
    title: '项目 / AurLemon Intro',
    meta: [
        { name: 'description', content: '我的一些项目和作品。' }
    ]
})
</script>

<style lang="scss">
    #githubCalendar {
        --color-calendar-graph-day-bg: #ffffff;
        --color-calendar-graph-day-L1-bg: hsl(200deg 84.94% 76.41%);
        --color-calendar-graph-day-L2-bg: hsl(200deg 50.56% 58.42%);
        --color-calendar-graph-day-L3-bg: hsl(200deg 44.1% 47.26%);
        --color-calendar-graph-day-L4-bg: hsl(200deg 56.12% 35.15%);

        .float-left, #user-activity-overview, .contrib-column {
            display: none;
        }

        .float-right {
            float: none;
        }
    }
</style>