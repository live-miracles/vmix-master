' Script name: AudioFade
'
' Smoothly fades audio in and out during transitions instead of cutting abruptly.
' Only applies to inputs that have "AudioFade" in their title.
'
' On startup the script configures each matching input:
'   - AudioAutoOff: prevents vMix from auto-muting on transition
'   - AutoPlayOn:   resumes playback when the input goes live
'   - AutoRestartOff/AutoPauseOff: keeps the video running continuously
'
' When a matching input goes off-air it fades to 0 over FADE_DOWN_TIME, then pauses
' and rewinds. When it comes back on-air it unmutes and fades up to MAX_VOLUME.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AudioFade 1.0.6")

' ===== Configurations =====
Dim MAX_VOLUME As Integer = 91       ' Target volume (0-100) when input is live
Dim FADE_DOWN_TIME As Integer = 3000 ' Fade-out duration in ms when going off-air
Dim FADE_UP_TIME As Integer = 1000   ' Fade-in duration in ms when coming on-air

Dim xml As New System.Xml.XmlDocument()
xml.LoadXml(API.XML())
Dim nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")
Dim inputNode As XmlNode

' Initial setup for all AudioFade inputs
For Each inputNode In nodeList
    Dim inputNumber = inputNode.Attributes("number").Value
    API.Function("AudioAutoOff", inputNumber)
    API.Function("AutoPlayOn", inputNumber)
    API.Function("AutoRestartOff", inputNumber)
    API.Function("AutoPauseOff", inputNumber)
Next

Do While True
    Sleep(500)

    Try
        xml.LoadXml(API.XML())

        Dim activeNumber = xml.SelectSingleNode("//active").InnerText

        nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")

        For Each inputNode In nodeList
            Dim isMuted As String = inputNode.Attributes("muted").Value
            Dim inputNumber As String = inputNode.Attributes("number").Value
            Dim isActive As Boolean = (inputNumber = activeNumber)

            If isMuted = "False" And Not isActive Then
                ' Input went off-air — fade out, pause and rewind
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AudioFade | Fading out input " & inputNumber)
                API.Function("SetVolumeFade", inputNumber, "0," & FADE_DOWN_TIME)
                Sleep(FADE_DOWN_TIME)
                API.Function("AudioOff", inputNumber)
                API.Function("Pause", inputNumber)
                API.Function("SetPosition", inputNumber, "0")
            ElseIf isMuted = "True" And isActive Then
                ' Input came on-air — unmute and fade in
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AudioFade | Fading in input " & inputNumber)
                API.Function("AudioOn", inputNumber)
                API.Function("SetVolumeFade", inputNumber, MAX_VOLUME & "," & FADE_UP_TIME)
                Sleep(FADE_UP_TIME)
            End If
        Next

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AudioFade | Unexpected error: " & ex.Message)
    End Try
Loop
