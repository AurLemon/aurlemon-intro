<template>
    <div class="aurle-project aurle-page">
        <div class="aurle-page-container">
            <ContentRenderer v-if="project" :value="project" class="aurle-page-content" />
            <div class="aurle-page-content" v-else>正在加载内容</div>
            <div class="aurle-project-item github-calendar" id="githubCalendar"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GitHubCalendar from 'github-calendar'
import 'github-calendar/dist/github-calendar-responsive.css'
import 'github-calendar/dist/github-calendar.css'

const { data: project } = await useAsyncData(() => queryCollection('content').path('/project').first())

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

<style scoped lang="scss">
    .aurle-project {
    }
</style>