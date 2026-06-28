' Script name: DurationTimer
'
' This script calculates the remaining time of the current input and
' updates this time in the GT input named "DurationTimer".
' If the current input has no duration, it will start counting up.
' Text input needs to be configured: Right click > Title Editor > Settings and
' - set Duration as "23:00:00"
' - select Display Format as "mm:ss"
' - turn on "Reverse"
' - turn on "Display 00:00:00 when Stopped"

Dim SCRIPT_NAME As String = "duration-timer"
Dim SCRIPT_VERSION As String = "1.2.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " DurationTimer " & SCRIPT_VERSION)

' --- VERSION CHECK ---
Try
    Dim verRequest As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(VERSIONS_URL)
    verRequest.Timeout = 5000
    Dim verResponse As System.Net.HttpWebResponse = verRequest.GetResponse()
    Dim verReader As New System.IO.StreamReader(verResponse.GetResponseStream())
    Dim verJson As String = verReader.ReadToEnd()
    verReader.Close()
    verResponse.Close()

    Dim key As String = """" & SCRIPT_NAME & """:"
    Dim keyIndex As Integer = verJson.IndexOf(key)
    If keyIndex >= 0 Then
        Dim valueStart As Integer = verJson.IndexOf("""", keyIndex + key.Length) + 1
        Dim valueEnd As Integer = verJson.IndexOf("""", valueStart)
        If valueStart > 0 And valueEnd > valueStart Then
            Dim latestVersion As String = verJson.Substring(valueStart, valueEnd - valueStart)
            If latestVersion <> SCRIPT_VERSION Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " DurationTimer | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " DurationTimer | Could not check for updates: " & ex.Message)
End Try

' ===== Configurations =====
Dim GT_INPUT_TITLE As String = "DurationTimer" ' Name of the GT title input to update
Dim YELLOW_TIME As Integer = 60                ' Seconds remaining when timer turns orange
Dim RED_TIME As Integer = 11                   ' Seconds remaining when timer turns red

Dim position As Double = 0
Dim duration As Double = 0

Dim xml As String = API.XML()
Dim x As New System.Xml.XmlDocument()
x.LoadXml(xml)
Dim textNode As XmlNode = x.SelectSingleNode("//input[@title='" & GT_INPUT_TITLE & "']")

If textNode Is Nothing Then
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " DurationTimer | Could not find a GT input named '" & GT_INPUT_TITLE & "'.")

    Dim firstTitle As String = Nothing
    Dim inputNodes As System.Xml.XmlNodeList = x.SelectNodes("//input")

    For Each inputNode As XmlNode In inputNodes
        Dim inputType As String = inputNode.Attributes("type").Value

        If inputType = "GT" Then
            firstTitle = inputNode.Attributes("title").Value
            API.Function("SetInputName", firstTitle, GT_INPUT_TITLE)
            Console.WriteLine("Renamed the first found GT '" & firstTitle & "' into '" & GT_INPUT_TITLE & "'.")
            Exit For
        End If
    Next

    If firstTitle Is Nothing Then
        API.Function("AddInput", "", "Title|C:\Program Files (x86)\vMix\titles\GT Text\Text Middle Centre Outline.gtzip")
        API.Function("SetInputName", "Text Middle Centre Outline.gtzip", GT_INPUT_TITLE)
        API.Function("MoveInput", GT_INPUT_TITLE, "1")
        API.Function("SetZoom", GT_INPUT_TITLE, "5")
        Console.WriteLine("Created a new GT input named '" & GT_INPUT_TITLE & "'.")
    End If
End If

Dim lastActive As String = "0"
Dim currentActive As String = "0"
Do While True
    Sleep(500)

    Try
        xml = API.XML()
        x.LoadXml(xml)

        Dim activeInput As String = x.SelectSingleNode("//active").InnerText

        Dim durationNode As XmlNode = x.SelectSingleNode("//input[@number='" & activeInput & "']/@duration")
        duration = If(durationNode IsNot Nothing, Double.Parse(durationNode.Value), 0)

        Dim positionNode As XmlNode = x.SelectSingleNode("//input[@number='" & activeInput & "']/@position")
        position = If(positionNode IsNot Nothing, Double.Parse(positionNode.Value), 0)

        If duration = 0 Then
            API.Function("SetTextColour", GT_INPUT_TITLE, "white")

            currentActive = activeInput
            If lastActive <> currentActive Then
                lastActive = currentActive
                API.Function("StopCountdown", GT_INPUT_TITLE)
            End If
            API.Function("StartCountdown", GT_INPUT_TITLE)
            Continue Do
        Else
            API.Function("StopCountdown", GT_INPUT_TITLE)
        End If

        Dim timeLeft As Integer = CInt(duration - position) \ 1000

        Dim hour As Integer = timeLeft \ 3600
        Dim min As Integer = (timeLeft Mod 3600) \ 60
        Dim sec As Integer = timeLeft Mod 60

        Dim timeStr As String = sec.ToString()
        If hour > 0 Then
            timeStr = hour.ToString() & ":" & min.ToString("00") & ":" & sec.ToString("00")
        ElseIf min > 0 Then
            timeStr = min.ToString() & ":" & sec.ToString("00")
        End If
        API.Function("SetText", GT_INPUT_TITLE, timeStr)

        If timeLeft < RED_TIME Then
            API.Function("SetTextColour", GT_INPUT_TITLE, "red")
        ElseIf timeLeft < YELLOW_TIME Then
            API.Function("SetTextColour", GT_INPUT_TITLE, "orange")
        Else
            API.Function("SetTextColour", GT_INPUT_TITLE, "green")
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " DurationTimer | Unexpected error: " & ex.Message)
    End Try
Loop
