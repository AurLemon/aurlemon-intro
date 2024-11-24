// config.d.ts

interface FriendLink {
    name: string
    url: string
    desc: string
    icon?: string
    stationmaster: {
        name: string
        contact: string
    }
}

interface AnnouncementIcon {
    type: string
    content: string
}

interface AnnouncementMoreInfo {
    text: string
    url: string
}

interface Announcement {
    id: number
    message: string 
    icon: AnnouncementIcon 
    more_info: AnnouncementMoreInfo[] 
    expires: string 
    closability: boolean 
}

interface Config {
    friend_link: FriendLink[]
    announcement: Announcement[]
}

export default Config